/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import React from 'react';
import { Camera, MessageSquare, BookOpen, Send, Upload, Home, Briefcase, Lightbulb, Gamepad2, PenTool, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'lab' | 'dialog' | 'tutor' | 'guru' | 'kuis' | 'solver' | 'tips' | 'jurnal'>('home');
  const [isGuruAuthenticated, setIsGuruAuthenticated] = useState(false);
  const [guruPassword, setGuruPassword] = useState('');
  const [guruView, setGuruView] = useState<'dashboard' | 'rpp' | 'lkpd' | 'asesmen'>('dashboard');
  const [guruResult, setGuruResult] = useState<string | null>(null);
  const [isGeneratingGuru, setIsGeneratingGuru] = useState(false);
  const [guruMateri, setGuruMateri] = useState('');
  const [guruKelas, setGuruKelas] = useState('7');
  const [guruJenisSoal, setGuruJenisSoal] = useState('Pilihan Ganda');
  const [guruJumlahSoal, setGuruJumlahSoal] = useState('5');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [literacyAnalysisResult, setLiteracyAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingLiteracy, setIsAnalyzingLiteracy] = useState(false);
  const [solverImage, setSolverImage] = useState<string | null>(null);
  const [isAnalyzingSolver, setIsAnalyzingSolver] = useState(false);
  
  // Updated State for Kuis
  const [kuisState, setKuisState] = useState<{
    active: boolean, 
    question: { question: string, options: string[], correctAnswer: string } | null, 
    level: number, 
    score: number,
    materi: string
  }>({active: false, question: null, level: 1, score: 0, materi: ''});
  const [jurnalContent, setJurnalContent] = useState('');
  const [solverState, setSolverState] = useState<{active: boolean, problem: string, step: number, feedback: string}>({active: false, problem: '', step: 0, feedback: ''});

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSolverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Hasil</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
            </style>
          </head>
          <body>
            ${content.replace(/\n/g, '<br>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const base64Data = selectedImage.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: "Analisis foto hasil praktikum IPA ini. Jelaskan apa yang terjadi dan berikan kesimpulan ilmiah yang relevan untuk siswa SMP. Hindari penggunaan markdown yang berlebihan." }
          ]
        }
      });
      setAnalysisResult(response.text || "Tidak ada hasil analisis.");
    } catch (error) {
      console.error(error);
      setAnalysisResult("Maaf, terjadi kesalahan saat menganalisis foto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeLiteracy = async () => {
    if (!textInput.trim()) return;
    setIsAnalyzingLiteracy(true);
    setLiteracyAnalysisResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analisis teks berikut untuk tingkat pemahaman siswa SMP. Berikan ringkasan, poin-poin penting, dan pertanyaan pemahaman. Hindari penggunaan markdown yang berlebihan.\n\nTeks:\n${textInput}`,
      });
      setLiteracyAnalysisResult(response.text || "Tidak ada hasil analisis.");
    } catch (error) {
      console.error(error);
      setLiteracyAnalysisResult("Maaf, terjadi kesalahan saat menganalisis materi.");
    } finally {
      setIsAnalyzingLiteracy(false);
    }
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;
    const userMessage = chatInput;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "Anda adalah SciLens AI, asisten pendidikan IPA profesional untuk siswa SMP. Jawablah pertanyaan dengan objektif, ilmiah, namun mudah dipahami. Gunakan kurikulum IPA Nasional sebagai acuan tingkat kesulitan. Jika jawaban siswa salah, jangan langsung menyalahkan, berikan petunjuk (scaffolding). Gunakan format teks yang bersih dan mudah dibaca. Hindari penggunaan markdown yang berlebihan atau tanda baca yang tidak perlu."
        }
      });
      setMessages((prev) => [...prev, { sender: 'ai', text: response.text || "Maaf, saya tidak bisa menjawab itu." }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { sender: 'ai', text: "Maaf, terjadi kesalahan saat menghubungi AI." }]);
    }
  };

  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'lab', label: 'Detektif Lab', icon: Camera },
    { id: 'dialog', label: 'Tanya AI', icon: MessageSquare },
    { id: 'tutor', label: 'Tutor Literasi', icon: BookOpen },
    { id: 'tips', label: 'Tips Belajar', icon: Lightbulb },
    { id: 'kuis', label: 'Game Seru', icon: Gamepad2 },
    { id: 'solver', label: 'Solver Sakti', icon: Send },
    { id: 'jurnal', label: 'Jurnal Belajar', icon: PenTool },
    { id: 'guru', label: 'Mode Guru', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="p-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-emerald-700 tracking-tight">SciLens <span className="text-emerald-500">AI</span></h1>
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">S</div>
        </div>
        <p className="text-sm text-slate-500 mt-1">Jelajahi keajaiban IPA dengan cerdas.</p>
      </header>

      {activeTab === 'home' && (
        <nav className="grid grid-cols-3 p-2 gap-2 bg-white border-b border-slate-100 sticky top-0 z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200 text-xs font-semibold ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={22} />
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      <main className="p-4 pb-20">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100"
        >
          {activeTab === 'home' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-800">Selamat Datang di SciLens AI!</h2>
              <p className="text-slate-600">
                SciLens AI adalah asisten cerdas yang dirancang khusus untuk membantu siswa SMP memahami pelajaran IPA dengan lebih menyenangkan dan mendalam.
              </p>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Fitur Kami:</h3>
                <div className="space-y-3 text-slate-700 text-sm">
                  <p><strong>Detektif Lab:</strong> Unggah foto hasil praktikum IPA Anda. AI akan menganalisis gambar tersebut, mengidentifikasi objek atau fenomena, dan memberikan penjelasan ilmiah yang akurat.</p>
                  <p><strong>Tanya AI:</strong> Konsultasikan kesulitan materi IPA Anda secara langsung. AI siap menjawab pertanyaan Anda dengan penjelasan yang mudah dipahami.</p>
                  <p><strong>Tutor Literasi:</strong> Masukkan teks materi IPA yang panjang. AI akan meringkasnya menjadi poin-poin penting dan memberikan pertanyaan untuk menguji pemahaman Anda.</p>
                  <p><strong>Tips Belajar:</strong> Dapatkan strategi dan metode belajar IPA yang efektif agar Anda dapat memahami konsep dengan lebih cepat dan menyenangkan.</p>
                  <p><strong>Game Seru:</strong> Uji pemahaman materi IPA Anda melalui permainan interaktif berbasis poin. Semakin banyak jawaban benar, semakin tinggi skor Anda!</p>
                  <p><strong>Solver Sakti:</strong> Dapatkan bantuan langkah-demi-langkah untuk menyelesaikan soal hitungan Fisika atau Kimia. Kami membantu Anda memahami prosesnya, bukan sekadar memberikan jawaban.</p>
                  <p><strong>Jurnal Belajar:</strong> Dokumentasikan hasil pengamatan praktikum dan catatan penting Anda. Gunakan fitur poin untuk membantu menyusun jurnal dengan rapi.</p>
                  <p><strong>Mode Guru:</strong> Fitur eksklusif bagi pendidik untuk mempercepat administrasi. AI akan membantu menyusun Rencana Pelaksanaan Pembelajaran (RPP), Lembar Kerja Peserta Didik (LKPD), dan perangkat Asesmen secara otomatis dan terstruktur.</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
                <p>Pengembang: Wahyu Sulaiman, M.Pd.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <a href="https://wa.me/6285737069855" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-200">WA: 085737069855</a>
                  <a href="mailto:sulaimanwahyu@gmail.com" className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-200">Email: sulaimanwahyu@gmail.com</a>
                  <a href="https://instagram.com/wahyusulaiman101" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-200">IG: @wahyusulaiman101</a>
                </div>
                <p className="mt-4 italic">Selamat belajar dan bereksplorasi!</p>
              </div>
            </div>
          )}
          {activeTab === 'lab' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Detektif Lab (Vision)</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Menganalisis gambar hasil praktikum atau fenomena alam secara ilmiah.</p>
                <p><strong>Cara Pakai:</strong> Klik "Unggah Foto", pilih gambar, lalu klik "Analisis Foto". AI akan menjelaskan apa yang ada di foto tersebut.</p>
              </div>
              <p className="text-slate-600">Unggah foto hasil praktikum Anda untuk dianalisis.</p>
              {selectedImage && (
                <div className="space-y-4">
                  <img src={selectedImage} alt="Hasil Praktikum" className="max-h-64 rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                  <button 
                    onClick={handleAnalyzeImage} 
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Menganalisis...' : 'Analisis Foto'}
                  </button>
                  {analysisResult && (
                    <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                      <h3 className="font-semibold mb-2">Hasil Analisis:</h3>
                      <p className="text-slate-700">{analysisResult}</p>
                    </div>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 cursor-pointer">
                <Upload size={20} /> {selectedImage ? 'Ganti Foto' : 'Unggah Foto'}
              </label>
            </div>
          )}
          {activeTab === 'dialog' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Tanya AI (Roleplay)</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Berdiskusi dengan AI mengenai materi IPA seolah-olah sedang berbicara dengan seorang ahli.</p>
                <p><strong>Cara Pakai:</strong> Ketik pertanyaan atau topik IPA di kolom pesan, lalu kirim. AI akan menjawab dengan penjelasan yang mudah dipahami.</p>
              </div>
              <div className="h-64 bg-slate-50 rounded-xl p-4 overflow-y-auto border border-slate-200 space-y-2">
                {messages.length === 0 && <p className="text-slate-500 italic">Dialog akan muncul di sini...</p>}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`p-2 rounded-lg ${msg.sender === 'user' ? 'bg-emerald-100 ml-auto' : 'bg-white'} max-w-[80%]`}>
                    {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ketik pesan Anda..."
                  className="flex-1 p-2 border border-slate-300 rounded-xl"
                />
                <button onClick={handleSendMessage} className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
          {activeTab === 'tutor' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Mode Tutor Literasi (Video & Teks)</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Meringkas materi teks IPA yang panjang menjadi poin-poin penting.</p>
                <p><strong>Cara Pakai:</strong> Masukkan teks materi ke dalam kolom, lalu klik "Analisis Materi". AI akan memberikan ringkasan dan pertanyaan pemahaman.</p>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Masukkan teks materi di sini..."
                className="w-full h-48 p-4 border border-slate-300 rounded-xl"
              />
              <button 
                onClick={handleAnalyzeLiteracy} 
                disabled={isAnalyzingLiteracy}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {isAnalyzingLiteracy ? 'Menganalisis...' : 'Analisis Materi'}
              </button>
              {literacyAnalysisResult && (
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <h3 className="font-semibold mb-2">Hasil Analisis:</h3>
                  <ReactMarkdown>{literacyAnalysisResult}</ReactMarkdown>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigator.clipboard.writeText(literacyAnalysisResult || '')} className="px-3 py-1 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Copy</button>
                    <button onClick={() => handlePrint(literacyAnalysisResult || '')} className="px-3 py-1 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Print</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'jurnal' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Jurnal Belajar IPA</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Mencatat hasil pengamatan praktikum atau catatan penting pelajaran.</p>
                <p><strong>Cara Pakai:</strong> Gunakan tombol kategori (Tujuan, Alat, dll.) untuk menyusun catatan, lalu tulis detailnya di kolom bawah dan klik "Simpan Catatan".</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Tujuan', 'Alat & Bahan', 'Langkah', 'Hasil', 'Kesimpulan'].map(point => (
                  <button 
                    key={point}
                    onClick={() => setJurnalContent(prev => prev + (prev ? '\n\n' : '') + `**${point}:** `)}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm hover:bg-emerald-200"
                  >
                    {point}
                  </button>
                ))}
              </div>
              <textarea 
                value={jurnalContent}
                onChange={(e) => setJurnalContent(e.target.value)}
                placeholder="Tuliskan hasil pengamatan atau catatan belajarmu di sini..." 
                className="w-full h-64 p-4 border rounded-xl" 
              />
              <button 
                onClick={() => alert('Catatan berhasil disimpan!')}
                className="w-full p-4 bg-emerald-600 text-white rounded-xl"
              >
                Simpan Catatan
              </button>
            </div>
          )}
          {activeTab === 'guru' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Mode Guru</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Membantu guru menyusun perangkat pembelajaran (RPP, LKPD, Asesmen) secara otomatis.</p>
                <p><strong>Cara Pakai:</strong> Masukkan kata kunci, pilih topik dan kelas, lalu pilih jenis perangkat yang ingin dibuat dan klik "Generate".</p>
              </div>
              {!isGuruAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-slate-600">Masukkan kata kunci untuk mengakses fitur guru.</p>
                  <input
                    type="password"
                    value={guruPassword}
                    onChange={(e) => setGuruPassword(e.target.value)}
                    placeholder="Kata kunci..."
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                  <button
                    onClick={() => {
                      if (guruPassword === 'gurusains') {
                        setIsGuruAuthenticated(true);
                      } else {
                        alert('Kata kunci salah!');
                      }
                    }}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    Masuk
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {guruView === 'dashboard' ? (
                    <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => { setGuruView('rpp'); setGuruResult(null); }} className="p-4 bg-emerald-100 text-emerald-800 rounded-xl font-semibold">RPP Generator</button>
                      <button onClick={() => { setGuruView('lkpd'); setGuruResult(null); }} className="p-4 bg-emerald-100 text-emerald-800 rounded-xl font-semibold">LKPD Generator</button>
                      <button onClick={() => { setGuruView('asesmen'); setGuruResult(null); }} className="p-4 bg-emerald-100 text-emerald-800 rounded-xl font-semibold">Asesmen Generator</button>
                      <button onClick={() => setIsGuruAuthenticated(false)} className="p-4 bg-slate-100 text-slate-800 rounded-xl font-semibold">Keluar</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button onClick={() => setGuruView('dashboard')} className="text-sm text-emerald-600 underline">Kembali ke Dashboard</button>
                      <input
                        type="text"
                        value={guruMateri}
                        onChange={(e) => setGuruMateri(e.target.value)}
                        placeholder="Masukkan materi/topik..."
                        className="w-full p-4 border border-slate-300 rounded-xl"
                      />
                      <select
                        value={guruKelas}
                        onChange={(e) => setGuruKelas(e.target.value)}
                        className="w-full p-4 border border-slate-300 rounded-xl"
                      >
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                      </select>
                      {guruView === 'asesmen' && (
                        <>
                          <select
                            value={guruJenisSoal}
                            onChange={(e) => setGuruJenisSoal(e.target.value)}
                            className="w-full p-4 border border-slate-300 rounded-xl"
                          >
                            <option value="Pilihan Ganda">Pilihan Ganda</option>
                            <option value="Uraian">Uraian</option>
                          </select>
                          <input
                            type="number"
                            value={guruJumlahSoal}
                            onChange={(e) => setGuruJumlahSoal(e.target.value)}
                            placeholder="Jumlah soal..."
                            className="w-full p-4 border border-slate-300 rounded-xl"
                          />
                        </>
                      )}
                      <button
                        onClick={async () => {
                          setIsGeneratingGuru(true);
                          setGuruResult(null);
                          try {
                            const prompt = guruView === 'asesmen'
                              ? `Buatkan ${guruJumlahSoal} soal ${guruJenisSoal} IPA untuk siswa SMP Kelas ${guruKelas} dengan topik: ${guruMateri}. Gunakan format yang rapi dan profesional.`
                              : `Buatkan ${guruView.toUpperCase()} IPA untuk siswa SMP Kelas ${guruKelas} dengan topik: ${guruMateri}. Gunakan format yang rapi dan profesional.`;
                            const response = await ai.models.generateContent({
                              model: "gemini-3-flash-preview",
                              contents: prompt,
                            });
                            setGuruResult(response.text || "Gagal menghasilkan.");
                          } catch (e) {
                            setGuruResult("Kesalahan saat menghasilkan.");
                          } finally {
                            setIsGeneratingGuru(false);
                          }
                        }}
                        disabled={isGeneratingGuru}
                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isGeneratingGuru ? 'Menghasilkan...' : `Generate ${guruView.toUpperCase()}`}
                      </button>
                      {guruResult && (
                        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                          <h3 className="font-semibold mb-2">Hasil:</h3>
                          <ReactMarkdown>{guruResult}</ReactMarkdown>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => navigator.clipboard.writeText(guruResult || '')} className="px-3 py-1 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Copy</button>
                            <button onClick={() => handlePrint(guruResult || '')} className="px-3 py-1 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Print</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Tips Belajar IPA</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900 mb-4">
                <p><strong>Fungsi:</strong> Memberikan panduan strategi belajar IPA yang efektif.</p>
                <p><strong>Cara Pakai:</strong> Baca tips yang tersedia, atau klik tombol "Konsultasi dengan SciLens" untuk bertanya lebih lanjut.</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
                <p>Belajar IPA itu seru! Berikut tips agar belajarmu lebih efektif:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>Amati Sekitarmu:</strong> IPA ada di mana-mana. Coba hubungkan materi di sekolah dengan kejadian sehari-hari.</li>
                  <li><strong>Praktik Langsung:</strong> Jangan hanya membaca, coba lakukan eksperimen sederhana di rumah.</li>
                  <li><strong>Gunakan Visual:</strong> Gambar diagram atau buat peta konsep agar lebih mudah mengingat materi yang kompleks.</li>
                  <li><strong>Tanya "Mengapa":</strong> Jangan ragu untuk bertanya "mengapa" dan "bagaimana" sesuatu terjadi.</li>
                  <li><strong>Konsisten:</strong> Belajar sedikit demi sedikit setiap hari lebih baik daripada belajar kebut semalam.</li>
                </ul>
                <button onClick={() => setActiveTab('dialog')} className="w-full p-4 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                  <MessageSquare size={20} />
                  Konsultasi dengan SciLens
                </button>
              </div>
            </div>
          )}
          {activeTab === 'kuis' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Game Seru</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Menguji pemahaman materi IPA melalui kuis interaktif.</p>
                <p><strong>Cara Pakai:</strong> Pilih materi, klik "Mulai Game", jawab soal yang muncul, dan kumpulkan skor tertinggi!</p>
              </div>
              {!kuisState.active ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Pilih materi untuk memulai game:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Suhu', 'Energi', 'Sel', 'Ekosistem'].map(m => (
                      <button key={m} onClick={() => setKuisState(prev => ({...prev, materi: m}))} className={`p-3 rounded-xl border ${kuisState.materi === m ? 'bg-emerald-100 border-emerald-500' : 'border-slate-200'}`}>{m}</button>
                    ))}
                  </div>
                  <button onClick={async () => {
                    if (!kuisState.materi) return;
                    setKuisState({...kuisState, active: true, level: 1, score: 0});
                    const response = await ai.models.generateContent({ 
                      model: "gemini-3-flash-preview", 
                      contents: `Berikan 1 soal IPA SMP materi ${kuisState.materi} level 1 dalam format JSON: { \"question\": \"...\", \"options\": [\"A...\", \"B...\", \"C...\", \"D...\"], \"correctAnswer\": \"...\" }. Jangan sertakan tanda baca atau penjelasan tambahan di luar JSON.` 
                    });
                    try {
                      const q = JSON.parse(response.text || '{}');
                      setKuisState(prev => ({...prev, question: q}));
                    } catch (e) {
                      setKuisState(prev => ({...prev, question: {question: 'Error memuat soal', options: [], correctAnswer: ''}}));
                    }
                  }} className="w-full p-4 bg-emerald-600 text-white rounded-xl disabled:bg-slate-300" disabled={!kuisState.materi}>Mulai Game</button>
                </div>
              ) : kuisState.question ? (
                <div className="space-y-4">
                  <p>Materi: {kuisState.materi} | Level: {kuisState.level} | Skor: {kuisState.score}</p>
                  <p className="p-4 bg-slate-100 rounded-xl font-medium">{kuisState.question.question}</p>
                  <div className="space-y-2">
                    {kuisState.question.options.map((opt, i) => (
                      <button key={i} onClick={async () => {
                        const isCorrect = opt === kuisState.question?.correctAnswer;
                        const newScore = isCorrect ? kuisState.score + 10 : kuisState.score;
                        const newLevel = isCorrect ? kuisState.level + 1 : Math.max(1, kuisState.level - 1);
                        
                        setKuisState(prev => ({...prev, question: null})); // Show loading
                        const response = await ai.models.generateContent({ 
                          model: "gemini-3-flash-preview", 
                          contents: `Soal: ${kuisState.question?.question}. Jawaban Anda: ${opt}. Apakah benar? Berikan feedback singkat. Lalu berikan soal berikutnya untuk materi ${kuisState.materi} level ${newLevel} dalam format JSON: { \"question\": \"...\", \"options\": [\"A...\", \"B...\", \"C...\", \"D...\"], \"correctAnswer\": \"...\" }. Jangan sertakan tanda baca atau penjelasan tambahan di luar JSON.` 
                        });
                        try {
                          const q = JSON.parse(response.text || '{}');
                          setKuisState(prev => ({...prev, level: newLevel, score: newScore, question: q}));
                        } catch (e) {
                          setKuisState(prev => ({...prev, question: {question: 'Error memuat soal berikutnya', options: [], correctAnswer: ''}}));
                        }
                      }} className="w-full p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 text-left">{opt}</button>
                    ))}
                  </div>
                </div>
              ) : <p className="text-slate-500 italic">Memuat soal...</p>}
            </div>
          )}
          {activeTab === 'solver' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                <ArrowLeft size={20} /> Kembali
              </button>
              <h2 className="text-lg font-semibold">Solver Sakti</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
                <p><strong>Fungsi:</strong> Membantu menyelesaikan soal hitungan Fisika atau Kimia.</p>
                <p><strong>Cara Pakai:</strong> Masukkan soal hitungan ke kolom, lalu klik tombol "Selesaikan Soal". AI akan memberikan langkah-langkah penyelesaiannya.</p>
              </div>
              <textarea id="solver-input" placeholder="Masukkan soal Fisika/Kimia..." className="w-full h-32 p-4 border rounded-xl" />
              <input type="file" accept="image/*" onChange={handleSolverImageUpload} className="hidden" id="solver-image-upload" />
              <label htmlFor="solver-image-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 cursor-pointer">
                <Upload size={20} /> {solverImage ? 'Ganti Foto Soal' : 'Lampirkan Foto Soal'}
              </label>
              {solverImage && <img src={solverImage} alt="Soal" className="max-h-48 rounded-xl border border-slate-200" referrerPolicy="no-referrer" />}
              
              <button onClick={async () => {
                const problem = (document.getElementById('solver-input') as HTMLTextAreaElement).value;
                let contents: any = `Selesaikan soal ini secara bertahap (scaffolding): ${problem}. Mulai dengan bertanya satuan apa yang diketahui.`;
                
                if (solverImage) {
                  const base64Data = solverImage.split(',')[1];
                  contents = [
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                    { text: `Selesaikan soal dalam gambar ini secara bertahap (scaffolding). Mulai dengan bertanya satuan apa yang diketahui. ${problem ? 'Tambahan soal: ' + problem : ''}` }
                  ];
                }

                setIsAnalyzingSolver(true);
                const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents });
                setIsAnalyzingSolver(false);
                setSolverState({active: true, problem: problem || 'Soal dari gambar', step: 1, feedback: response.text || 'Error'});
              }} className="w-full p-4 bg-emerald-600 text-white rounded-xl disabled:opacity-50" disabled={isAnalyzingSolver}>
                {isAnalyzingSolver ? 'Menganalisis...' : 'Mulai Selesaikan'}
              </button>
              {solverState.active && (
                <div className="p-4 bg-slate-100 rounded-xl">
                  <p>{solverState.feedback}</p>
                  <input type="text" id="solver-jawaban" placeholder="Jawaban Anda..." className="w-full p-2 border rounded-xl mt-2" />
                  <button onClick={async () => {
                    const jawaban = (document.getElementById('solver-jawaban') as HTMLInputElement).value;
                    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Soal: ${solverState.problem}. Feedback sebelumnya: ${solverState.feedback}. Jawaban murid: ${jawaban}. Berikan langkah selanjutnya.` });
                    setSolverState(prev => ({...prev, step: prev.step + 1, feedback: response.text || 'Error'}));
                  }} className="mt-2 p-2 bg-emerald-600 text-white rounded-xl">Lanjut</button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
