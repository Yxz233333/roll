import { useState, useEffect, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";

// translation dictionary used by Home component
const text: Record<string, any> = {
  zh: {
    title: "课堂随机点名系统",
    subtitle: "教室版",
    installApp: "安装应用",
    installStandaloneTitle: "作为独立应用安装",
    installStandaloneDesc: "安装此工具到您的设备以便离线使用。它可以在没有浏览器的情况下完美运行！",
    readyToInstall: "准备安装",
    readyToInstallDesc: "您的设备支持一键直接安装。",
    installNow: "立即安装",
    pwaWindowsMac: "Windows / Mac（Chrome & Edge）",
    pwaWindowsMacDesc: '在浏览器地址栏中寻找安装图标，或打开浏览器菜单 (⋮) 并选择 "安装应用"。',
    pwaIOS: "iOS（iPhone & iPad）",
    pwaIOSDesc: '在 Safari 中打开。点击底部的分享按钮，向下滚动并选择 "添加到主屏幕"。',
    pwaAndroid: "Android",
    pwaAndroidDesc: '在 Chrome 中打开。点击菜单 (⋮) 并选择 "安装应用" 或 "添加到主屏幕"。',
    manageRoster: "管理名单",
    ready: "就绪！",
    manageRosterDesc: "通过文本或上传文件导入学生。姓名将自动离线保存。",
    pasteType: "粘贴/输入",
    uploadFile: "上传文件",
    placeholderNames: "输入姓名，用换行或逗号隔开...",
    addStudents: "添加学生",
    uploadRoster: "上传名单",
    supportsFiles: "支持 .txt、.csv、.xls、.xlsx",
    excelNote: "对于 Excel 文件，工具会从第一列提取姓名。",
    totalStudents: "总学生数",
    clearAll: "全部清除",
    areYouSureClear: "确定要删除所有学生吗？此操作无法撤销。",
    listCleared: "名单已清除",
    startFresh: "通过添加新学生重新开始。",
    listReset: "名单已重置！",
    listResetDesc: "所有已抽取学生已重新加入池中。",
    noStudentsLeft: "没有剩余学生！",
    pleaseResetOrAdd: "请重置名单或添加更多学生。",
    rosterEmpty: "名单为空",
    clickManageRoster: "点击“管理名单”添加学生。",
    drawing: "抽取中...",
    startDraw: "开始抽取",
    resetList: "重置名单",
    remaining: "剩余",
    alreadyDrawn: "已抽取",
    noOneDrawnYet: "尚未抽取任何人。",
    language: "语言",
    zh: "中文",
    en: "English",
    noNewNames: "没有找到新姓名",
    newNamesDesc: "提供的所有姓名都已在名单中或为空。",
    studentsAdded: "学生已添加！",
    studentsAddedDesc: (n: number) => `添加了 ${n} 名新学生。`,
    selectFile: "选择文件",
    errorParsingFile: "解析文件时出错",
    checkFileFormat: "请检查文件格式并重试。",
  },
  en: {
    title: "Random Student Picker",
    subtitle: "Classroom Edition",
    installApp: "Install App",
    installStandaloneTitle: "Install as Standalone App",
    installStandaloneDesc: "Install this tool to your device for offline use. It will run perfectly without a browser!",
    readyToInstall: "Ready to Install",
    readyToInstallDesc: "Your device supports direct installation in one click.",
    installNow: "Install Now",
    pwaWindowsMac: "Windows / Mac (Chrome & Edge)",
    pwaWindowsMacDesc: 'Look for the install icon in your browser\'s address bar, or open the browser menu (⋮) and select "Install app".',
    pwaIOS: "iOS (iPhone & iPad)",
    pwaIOSDesc: 'Open in Safari. Tap the Share button at the bottom of the screen, scroll down, and select "Add to Home Screen".',
    pwaAndroid: "Android",
    pwaAndroidDesc: 'Open in Chrome. Tap the menu (⋮) and select "Install app" or "Add to Home Screen".',
    manageRoster: "Manage Roster",
    ready: "Ready!",
    manageRosterDesc: "Import students via text or upload a file. Names are automatically saved offline.",
    pasteType: "Paste / Type",
    uploadFile: "Upload File",
    placeholderNames: "Enter names separated by newlines or commas...",
    addStudents: "Add Students",
    uploadRoster: "Upload Roster",
    supportsFiles: "Supports .txt, .csv, .xls, .xlsx",
    excelNote: "For Excel files, the tool will extract names from the first column.",
    totalStudents: "Total Students",
    clearAll: "Clear All",
    areYouSureClear: "Are you sure you want to delete all students? This cannot be undone.",
    listCleared: "List cleared",
    startFresh: "Start fresh by adding new students.",
    listReset: "List reset!",
    listResetDesc: "All drawn students are back in the pool.",
    noStudentsLeft: "No students left!",
    pleaseResetOrAdd: "Please reset the list or add more students.",
    rosterEmpty: "Roster is empty",
    clickManageRoster: 'Click "Manage Roster" to add students.',
    drawing: "Drawing...",
    startDraw: "START DRAW",
    resetList: "Reset List",
    remaining: "Remaining",
    alreadyDrawn: "Already Drawn",
    noOneDrawnYet: "No one drawn yet.",
    language: "Language",
    zh: "中文",
    en: "English",
    noNewNames: "No new names found",
    newNamesDesc: "All names provided are already in the list or empty.",
    studentsAdded: "Students added!",
    studentsAddedDesc: (n: number) => `Added ${n} new student(s).`,
    selectFile: "Select File",
    errorParsingFile: "Error parsing file",
    checkFileFormat: "Please check the file format and try again.",
  }
};
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, RefreshCw, Trash2, Trophy, Users, 
  Smartphone, Monitor, Settings, Play, 
  DownloadCloud, Share, Plus
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [remaining, setRemaining] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('picker_remaining');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [drawn, setDrawn] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('picker_drawn');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState(text['zh'].ready);
  const [manualInput, setManualInput] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // language state (zh by default)
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const toggleLang = () => setLang(prev => (prev === 'zh' ? 'en' : 'zh'));

  // Save to local storage whenever lists change
  useEffect(() => {
    localStorage.setItem('picker_remaining', JSON.stringify(remaining));
  }, [remaining]);

  useEffect(() => {
    localStorage.setItem('picker_drawn', JSON.stringify(drawn));
  }, [drawn]);

  // update display text when language toggles (only if it was the ready message)
  useEffect(() => {
    if (currentDisplay === text[lang === 'zh' ? 'en' : 'zh'].ready) {
      setCurrentDisplay(text[lang].ready);
    }
  }, [lang]);

  // PWA Install prompt listener
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const addStudents = (names: string[]) => {
    const cleanNames = names.map(n => n.trim()).filter(n => n.length > 0);
    // Filter out duplicates within the new list and existing remaining/drawn
    const allExisting = new Set([...remaining, ...drawn]);
    const uniqueNew = cleanNames.filter(n => !allExisting.has(n));
    
    if (uniqueNew.length === 0) {
      toast({ title: text[lang].noNewNames, description: text[lang].newNamesDesc });
      return;
    }

    setRemaining(prev => [...prev, ...uniqueNew]);
    toast({ 
      title: text[lang].studentsAdded, 
      description: text[lang].studentsAddedDesc(uniqueNew.length),
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
        toast({ title: text[lang].errorParsingFile, description: text[lang].checkFileFormat, variant: "destructive" });
      }
      // Reset file input
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
        title: text[lang].noStudentsLeft, 
        description: text[lang].pleaseResetOrAdd, 
        variant: "destructive" 
      });
      return;
    }

    setIsDrawing(true);
    const drawDuration = 2500;
    const startTime = Date.now();
    
    // Fast rolling animation
    const roll = () => {
      const now = Date.now();
      if (now - startTime < drawDuration) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        setCurrentDisplay(remaining[randomIndex]);
        requestAnimationFrame(roll);
      } else {
        // End of draw - pick final winner
        const winnerIndex = Math.floor(Math.random() * remaining.length);
        const winner = remaining[winnerIndex];
        
        setCurrentDisplay(winner);
        setIsDrawing(false);
        
        // Update lists
        const newRemaining = remaining.filter((_, i) => i !== winnerIndex);
        setRemaining(newRemaining);
        setDrawn([...drawn, winner]);
        
        // Fire Confetti
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
    setRemaining([...remaining, ...drawn]);
    setDrawn([]);
    setCurrentDisplay(text[lang].ready);
    toast({ title: text[lang].listReset, description: text[lang].listResetDesc });
  };

  const clearAll = () => {
    if (window.confirm(text[lang].areYouSureClear)) {
      setRemaining([]);
      setDrawn([]);
      setCurrentDisplay(text[lang].ready || "Ready!");
      toast({ title: text[lang].listCleared, description: text[lang].startFresh });
    }
  };

  const totalStudents = remaining.length + drawn.length;

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-8">
      {/* Language switcher moved to outer container */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1">
          <span className="text-sm">{text[lang].language}:</span>
          <button onClick={toggleLang} className="text-sm font-semibold">
            {lang === 'zh' ? text[lang].en : text[lang].zh}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">{text[lang].title}</h1>
            <p className="text-muted-foreground font-medium">{text[lang].subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Install PWA Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 font-semibold">
                <DownloadCloud className="w-4 h-4" /> {text[lang].installApp}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">{text[lang].installStandaloneTitle}</DialogTitle>
                <DialogDescription>
                  {text[lang].installStandaloneDesc}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 my-4">
                {deferredPrompt ? (
                  <div className="bg-primary/10 p-6 rounded-xl flex flex-col items-center text-center gap-4 border border-primary/20">
                     <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                       <Smartphone className="w-8 h-8 text-primary" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">{text[lang].readyToInstall}</h3>
                       <p className="text-sm text-muted-foreground mt-1">{text[lang].readyToInstallDesc}</p>
                     </div>
                     <Button size="lg" onClick={handleInstallClick} className="w-full font-bold text-lg">{text[lang].installNow}</Button>
                  </div>
                ) : (
                  <div className="space-y-6 p-2">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{text[lang].pwaWindowsMac}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {text[lang].pwaWindowsMacDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{text[lang].pwaIOS}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {text[lang].pwaIOSDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{text[lang].pwaAndroid}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {text[lang].pwaAndroidDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Roster Management Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2 font-semibold">
                <Settings className="w-4 h-4" /> {text[lang].manageRoster}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{text[lang].manageRoster}</DialogTitle>
                <DialogDescription>
                  {text[lang].manageRosterDesc}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="paste" className="mt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="paste">{text[lang].pasteType}</TabsTrigger>
                  <TabsTrigger value="upload">{text[lang].uploadFile}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="space-y-4 pt-4">
                  <Textarea 
                    placeholder={text[lang].placeholderNames} 
                    className="min-h-[150px] resize-none"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                  />
                  <Button onClick={handleManualAdd} className="w-full font-bold">
                    <Plus className="w-4 h-4 mr-2" /> {text[lang].addStudents}
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-1">{text[lang].uploadRoster}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{text[lang].supportsFiles}</p>
                    
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                      {text[lang].selectFile}
                    </label>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept=".txt,.csv,.xlsx,.xls" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {text[lang].excelNote}
                  </p>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-medium">{totalStudents} {text[lang].totalStudents}</span>
                <Button variant="destructive" size="sm" onClick={clearAll} className="gap-2">
                  <Trash2 className="w-4 h-4" /> {text[lang].clearAll}
                </Button>
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
                <p className="text-xl md:text-2xl font-semibold">{text[lang].rosterEmpty}</p>
                <p>{text[lang].clickManageRoster}</p>
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
          
          {/* Decorative background blob */}
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
            {isDrawing ? text[lang].drawing : text[lang].startDraw}
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto text-lg h-16 px-8 rounded-full font-semibold border-2"
            onClick={resetList}
            disabled={isDrawing || drawn.length === 0}
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            {text[lang].resetList}
          </Button>
        </div>

        {/* Stats & History Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto pt-8">
          
          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{text[lang].remaining}</p>
                <p className="text-4xl font-black text-primary">{remaining.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-none shadow-none md:col-span-2">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{text[lang].alreadyDrawn} ({drawn.length})</p>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 pb-2">
                {drawn.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{text[lang].noOneDrawnYet}</p>
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