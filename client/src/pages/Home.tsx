import { useState, useEffect, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
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
  const [currentDisplay, setCurrentDisplay] = useState("Ready!");
  const [manualInput, setManualInput] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Save to local storage whenever lists change
  useEffect(() => {
    localStorage.setItem('picker_remaining', JSON.stringify(remaining));
  }, [remaining]);

  useEffect(() => {
    localStorage.setItem('picker_drawn', JSON.stringify(drawn));
  }, [drawn]);

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
      toast({ title: "No new names found", description: "All names provided are already in the list or empty." });
      return;
    }

    setRemaining(prev => [...prev, ...uniqueNew]);
    toast({ 
      title: "Students added!", 
      description: `Added ${uniqueNew.length} new student(s).`,
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
        toast({ title: "Error parsing file", description: "Please check the file format and try again.", variant: "destructive" });
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
        title: "No students left!", 
        description: "Please reset the list or add more students.", 
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
    setCurrentDisplay("Ready!");
    toast({ title: "List reset!", description: "All drawn students are back in the pool." });
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to delete all students? This cannot be undone.")) {
      setRemaining([]);
      setDrawn([]);
      setCurrentDisplay("Ready!");
      toast({ title: "List cleared", description: "Start fresh by adding new students." });
    }
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
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">Random Picker</h1>
            <p className="text-muted-foreground font-medium">Classroom Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Install PWA Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 font-semibold">
                <DownloadCloud className="w-4 h-4" /> Install App
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Install as Standalone App</DialogTitle>
                <DialogDescription>
                  Install this tool to your device for offline use. It will run perfectly without a browser!
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 my-4">
                {deferredPrompt ? (
                  <div className="bg-primary/10 p-6 rounded-xl flex flex-col items-center text-center gap-4 border border-primary/20">
                     <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                       <Smartphone className="w-8 h-8 text-primary" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">Ready to Install</h3>
                       <p className="text-sm text-muted-foreground mt-1">Your device supports direct installation in one click.</p>
                     </div>
                     <Button size="lg" onClick={handleInstallClick} className="w-full font-bold text-lg">Install Now</Button>
                  </div>
                ) : (
                  <div className="space-y-6 p-2">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Windows / Mac (Chrome & Edge)</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          Look for the install icon <DownloadCloud className="inline w-4 h-4 mx-1" /> in your browser's address bar, or open the browser menu (⋮) and select <strong>"Install app"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">iOS (iPhone & iPad)</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          Open in Safari. Tap the Share button <Share className="inline w-4 h-4 mx-1" /> at the bottom of the screen, scroll down, and select <strong>"Add to Home Screen"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Android</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          Open in Chrome. Tap the menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
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
                <Settings className="w-4 h-4" /> Manage Roster
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Manage Roster</DialogTitle>
                <DialogDescription>
                  Import students via text or upload a file. Names are automatically saved offline.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="paste" className="mt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="paste">Paste / Type</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="space-y-4 pt-4">
                  <Textarea 
                    placeholder="Enter names separated by newlines or commas..." 
                    className="min-h-[150px] resize-none"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                  />
                  <Button onClick={handleManualAdd} className="w-full font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add Students
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-1">Upload Roster</h3>
                    <p className="text-sm text-muted-foreground mb-4">Supports .txt, .csv, .xls, .xlsx</p>
                    
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                      Select File
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
                    For Excel files, the tool will extract names from the first column.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-medium">{totalStudents} Total Students</span>
                <Button variant="destructive" size="sm" onClick={clearAll} className="gap-2">
                  <Trash2 className="w-4 h-4" /> Clear All
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
                <p className="text-xl md:text-2xl font-semibold">Roster is empty</p>
                <p>Click "Manage Roster" to add students.</p>
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
            {isDrawing ? 'Drawing...' : 'START DRAW'}
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto text-lg h-16 px-8 rounded-full font-semibold border-2"
            onClick={resetList}
            disabled={isDrawing || drawn.length === 0}
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            Reset List
          </Button>
        </div>

        {/* Stats & History Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto pt-8">
          
          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-4xl font-black text-primary">{remaining.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-none shadow-none md:col-span-2">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Already Drawn ({drawn.length})</p>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 pb-2">
                {drawn.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No one drawn yet.</p>
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