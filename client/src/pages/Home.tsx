import { useState, useEffect, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, RefreshCw, Trash2, Trophy, Users, 
  Smartphone, Monitor, Settings, Play, 
  DownloadCloud, Share, Plus, Download,
  Globe, Trash, Edit2, Check, X
} from "lucide-react";
import { Language, getTranslation } from "@/lib/i18n";

interface StudentRoster {
  id: string;
  name: string;
  remaining: string[];
  drawn: string[];
}

const DEFAULT_ROSTER_NAME = "Roster 1";

export default function Home() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('picker_language');
      return (saved as Language) || 'zh';
    } catch { return 'zh'; }
  });

  const [rosters, setRosters] = useState<StudentRoster[]>(() => {
    try {
      const saved = localStorage.getItem('picker_rosters');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      // Migration from old format
      const oldRemaining = localStorage.getItem('picker_remaining');
      const oldDrawn = localStorage.getItem('picker_drawn');
      if (oldRemaining || oldDrawn) {
        return [{
          id: '1',
          name: DEFAULT_ROSTER_NAME,
          remaining: oldRemaining ? JSON.parse(oldRemaining) : [],
          drawn: oldDrawn ? JSON.parse(oldDrawn) : []
        }];
      }
      return [{
        id: '1',
        name: DEFAULT_ROSTER_NAME,
        remaining: [],
        drawn: []
      }];
    } catch { 
      return [{
        id: '1',
        name: DEFAULT_ROSTER_NAME,
        remaining: [],
        drawn: []
      }]; 
    }
  });

  const [currentRosterId, setCurrentRosterId] = useState('1');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState(getTranslation(language, 'readyToStart'));
  const [manualInput, setManualInput] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [newRosterName, setNewRosterName] = useState("");
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const currentRoster = rosters.find(r => r.id === currentRosterId) || rosters[0];
  const remaining = currentRoster?.remaining || [];
  const drawn = currentRoster?.drawn || [];

  // Save rosters to localStorage
  useEffect(() => {
    localStorage.setItem('picker_rosters', JSON.stringify(rosters));
  }, [rosters]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('picker_language', language);
  }, [language]);

  // Update display text when language changes
  useEffect(() => {
    setCurrentDisplay(getTranslation(language, 'readyToStart'));
  }, [language]);

  // PWA Install prompt listener
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const t = (key: keyof typeof import('@/lib/i18n').translations.en, replacements?: Record<string, string | number>) => 
    getTranslation(language, key, replacements);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const updateCurrentRoster = (updates: Partial<StudentRoster>) => {
    setRosters(rosters.map(r => 
      r.id === currentRosterId ? { ...r, ...updates } : r
    ));
  };

  const addStudents = (names: string[]) => {
    const cleanNames = names.map(n => n.trim()).filter(n => n.length > 0);
    const allExisting = new Set([...remaining, ...drawn]);
    const uniqueNew = cleanNames.filter(n => !allExisting.has(n));
    
    if (uniqueNew.length === 0) {
      toast({ title: t('noNewNames'), description: t('noNewNamesDesc') });
      return;
    }

    updateCurrentRoster({ remaining: [...remaining, ...uniqueNew] });
    toast({ 
      title: t('studentsAdded'),
      description: t('addedCount', { count: uniqueNew.length }),
      variant: "default"
    });
    setManualInput("");
  };

  const handleManualAdd = () => {
    const names = manualInput.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    addStudents(names);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      
      try {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const names: string[] = [];
          json.forEach((row: any) => {
            const vals = Object.values(row);
            if (vals.length > 0 && typeof vals[0] === 'string') {
              names.push(vals[0].trim());
            }
          });
          addStudents(names);
        } else {
          const text = data as string;
          const names = text.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
          addStudents(names);
        }
      } catch (err) {
        toast({ title: t('errorParsing'), description: t('errorParsingDesc'), variant: "destructive" });
      }
      e.target.value = '';
    };
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const startDraw = () => {
    if (remaining.length === 0) {
      toast({ 
        title: t('noStudents'),
        description: t('noStudentsDesc'),
        variant: "destructive" 
      });
      return;
    }

    setIsDrawing(true);
    const drawDuration = 2500;
    const startTime = Date.now();
    
    const roll = () => {
      const now = Date.now();
      if (now - startTime < drawDuration) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        setCurrentDisplay(remaining[randomIndex]);
        requestAnimationFrame(roll);
      } else {
        const winnerIndex = Math.floor(Math.random() * remaining.length);
        const winner = remaining[winnerIndex];
        
        setCurrentDisplay(winner);
        setIsDrawing(false);
        
        const newRemaining = remaining.filter((_, i) => i !== winnerIndex);
        updateCurrentRoster({ remaining: newRemaining, drawn: [...drawn, winner] });
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#818cf8', '#facc15', '#f472b6', '#34d399']
        });
      }
    };
    
    requestAnimationFrame(roll);
  };

  const resetList = () => {
    if (remaining.length === 0 && drawn.length === 0) return;
    updateCurrentRoster({ remaining: [...remaining, ...drawn], drawn: [] });
    setCurrentDisplay(t('readyToStart'));
    toast({ title: t('listReset'), description: t('listResetDesc') });
  };

  const clearAll = () => {
    if (window.confirm(t('confirmDeleteAll'))) {
      updateCurrentRoster({ remaining: [], drawn: [] });
      setCurrentDisplay(t('readyToStart'));
      toast({ title: t('listCleared'), description: t('listClearedDesc') });
    }
  };

  const exportToCSV = () => {
    const allNames = [...remaining, ...drawn];
    if (allNames.length === 0) {
      toast({ title: t('noToExport'), description: t('noToExportDesc') });
      return;
    }

    const csvContent = [
      ["Name", "Status"],
      ...remaining.map(name => [name, "Remaining"]),
      ...drawn.map(name => [name, "Drawn"])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentRoster?.name || 'roster'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: t('exported'),
      description: t('downloadedCount', { count: allNames.length })
    });
  };

  const exportToExcel = () => {
    const allNames = [...remaining, ...drawn];
    if (allNames.length === 0) {
      toast({ title: t('noToExport'), description: t('noToExportDesc') });
      return;
    }

    const wsData = [
      ["Name", "Status"],
      ...remaining.map(name => [name, "Remaining"]),
      ...drawn.map(name => [name, "Drawn"])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }];

    XLSX.writeFile(wb, `${currentRoster?.name || 'roster'}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ 
      title: t('exported'),
      description: t('downloadedExcel', { count: allNames.length })
    });
  };

  const createRoster = () => {
    if (!newRosterName.trim()) return;
    
    const newId = String(Math.max(...rosters.map(r => parseInt(r.id) || 0)) + 1);
    setRosters([...rosters, {
      id: newId,
      name: newRosterName,
      remaining: [],
      drawn: []
    }]);
    setCurrentRosterId(newId);
    setNewRosterName("");
    toast({ title: `${t('newRoster')} "${newRosterName}"`, variant: "default" });
  };

  const deleteRoster = (id: string) => {
    if (rosters.length === 1) {
      toast({ title: "Cannot delete the last roster", variant: "destructive" });
      return;
    }
    if (window.confirm(t('confirmDelete'))) {
      const newRosters = rosters.filter(r => r.id !== id);
      setRosters(newRosters);
      if (currentRosterId === id) {
        setCurrentRosterId(newRosters[0].id);
      }
    }
  };

  const renameRoster = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setRosters(rosters.map(r => 
      r.id === id ? { ...r, name: newName } : r
    ));
    setEditingRosterId(null);
    setEditingName("");
  };

  const totalStudents = remaining.length + drawn.length;

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">{t('appName')}</h1>
            <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Language Switch */}
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 font-semibold"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? '中文' : 'English'}
          </Button>

          {/* Install App */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 font-semibold">
                <DownloadCloud className="w-4 h-4" /> {t('installApp')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">{t('installAsApp')}</DialogTitle>
                <DialogDescription>{t('installAsAppDesc')}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 my-4">
                {deferredPrompt ? (
                  <div className="bg-primary/10 p-6 rounded-xl flex flex-col items-center text-center gap-4 border border-primary/20">
                     <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                       <Smartphone className="w-8 h-8 text-primary" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">{t('readyToInstall')}</h3>
                       <p className="text-sm text-muted-foreground mt-1">{t('yourDeviceSupports')}</p>
                     </div>
                     <Button size="lg" onClick={handleInstallClick} className="w-full font-bold text-lg">{t('installNow')}</Button>
                  </div>
                ) : (
                  <div className="space-y-6 p-2">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{t('windows')}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t('windowsDesc')}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{t('ios')}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t('iosDesc')}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{t('android')}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t('androidDesc')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage Roster */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2 font-semibold">
                <Settings className="w-4 h-4" /> {t('manageRoster')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{t('manageRosterTitle')}</DialogTitle>
                <DialogDescription>{t('manageRosterDesc')}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Roster List */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-bold mb-4">{t('myRosters')}</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {rosters.map(roster => (
                      <div 
                        key={roster.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentRosterId === roster.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-background border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setCurrentRosterId(roster.id)}
                      >
                        <div className="flex-1">
                          {editingRosterId === roster.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') renameRoster(roster.id, editingName);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div>
                              <p className="font-semibold">{roster.name}</p>
                              <p className="text-xs text-muted-foreground">{roster.remaining.length} remaining, {roster.drawn.length} drawn</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-2">
                          {editingRosterId === roster.id ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  renameRoster(roster.id, editingName);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRosterId(null);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRosterId(roster.id);
                                  setEditingName(roster.name);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRoster(roster.id);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* New Roster */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('rosterName')}
                      value={newRosterName}
                      onChange={(e) => setNewRosterName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') createRoster();
                      }}
                    />
                    <Button onClick={createRoster} className="gap-2">
                      <Plus className="w-4 h-4" /> {t('create')}
                    </Button>
                  </div>
                </div>

                {/* Import Students */}
                <Tabs defaultValue="paste">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="paste">{t('paste')}</TabsTrigger>
                    <TabsTrigger value="upload">{t('uploadFile')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="paste" className="space-y-4 pt-4">
                    <Textarea 
                      placeholder={t('enterNames')}
                      className="min-h-[150px] resize-none"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                    />
                    <Button onClick={handleManualAdd} className="w-full font-bold">
                      <Plus className="w-4 h-4 mr-2" /> {t('addStudents')}
                    </Button>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4 pt-4">
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-1">{t('uploadRoster')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('supports')}</p>
                      
                      <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        {t('selectFile')}
                      </label>
                      <input 
                        id="file-upload" 
                        type="file" 
                        accept=".txt,.csv,.xlsx,.xls" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">{t('excelNote')}</p>
                  </TabsContent>
                </Tabs>

                {/* Export & Clear */}
                <div className="pt-4 border-t border-border flex justify-between items-center flex-wrap gap-2">
                  <span className="text-sm font-medium">{totalStudents} {t('totalStudents')}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToCSV} 
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" /> {t('csv')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToExcel} 
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" /> {t('excel')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={clearAll} className="gap-2">
                      <Trash2 className="w-4 h-4" /> {t('clearAll')}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full gap-8">
        
        {/* The Big Stage */}
        <Card className="w-full aspect-[16/9] max-h-[60vh] flex items-center justify-center border-4 border-primary/10 shadow-2xl relative overflow-hidden bg-card">
          <CardContent className="p-8 md:p-16 flex flex-col items-center justify-center text-center w-full h-full relative z-10">
            {totalStudents === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-4">
                <Users className="w-16 h-16 opacity-50" />
                <p className="text-xl md:text-2xl font-semibold">{t('rosterEmpty')}</p>
                <p>{t('rosterEmptyDesc')}</p>
              </div>
            ) : (
              <div 
                className={`font-display font-black text-center px-4 w-full transition-all duration-300 ${
                  isDrawing 
                    ? 'text-muted-foreground blur-[2px] scale-95 text-5xl md:text-7xl' 
                    : 'text-primary scale-100 text-6xl md:text-8xl lg:text-9xl tracking-tight'
                }`}
                style={{ wordBreak: "break-word", lineHeight: 1.1 }}
              >
                {currentDisplay}
              </div>
            )}
          </CardContent>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-3xl -z-0"></div>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-xl h-16 px-12 rounded-full font-bold shadow-xl shadow-accent/20 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={startDraw}
            disabled={isDrawing || remaining.length === 0}
          >
            <Play className="w-6 h-6 mr-3 fill-current" />
            {isDrawing ? t('drawing') : t('startDraw')}
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto text-lg h-16 px-8 rounded-full font-semibold border-2"
            onClick={resetList}
            disabled={isDrawing || drawn.length === 0}
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            {t('resetList')}
          </Button>
        </div>

        {/* Stats & History Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto pt-8">
          
          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('remaining')}</p>
                <p className="text-4xl font-black text-primary">{remaining.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-none shadow-none md:col-span-2">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('drawn')} ({drawn.length})</p>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 pb-2">
                {drawn.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{language === 'en' ? 'No one drawn yet.' : '还没有人被抽取。'}</p>
                ) : (
                  drawn.map((name, idx) => (
                    <span key={idx} className="bg-background border px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      {name}
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}