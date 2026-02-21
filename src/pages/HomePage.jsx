import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import client from '../api/client';

export default function HomePage() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'video/*': ['.mp4', '.avi', '.mov']
        },
        maxFiles: 1,
        maxSize: 200 * 1024 * 1024, // 200MB
    });

    const uploadFile = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await client.post('/api/analysis/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });

            // Pass result to ResultPage
            navigate('/result', { state: { result: response.data } });
        } catch (err) {
            console.error(">>> FRONTEND UPLOAD CRASH LOG <<<");
            console.error("Full Error Object:", err);
            console.error("Backend Error Response:", err.response?.data);
            console.error("HTTP Status Code:", err.response?.status);

            setError(err.response?.data?.error || err.message || 'Error uploading file. Check Console.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-20 px-4 relative">
            {/* Decorative background blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

            <div className="text-center mb-16 relative z-10">
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4 border border-indigo-100 dark:border-indigo-500/20">
                    AI-Powered Traffic Intelligence
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight flex flex-col items-center">
                    <span>Traffic Density Analyzer</span>
                    <span className="block mt-2 gradient-text">Real-Time Analytics</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
                    Upload a traffic feed to automatically detect vehicles, calculate lane density, and generate dynamic signal control timings.
                </p>
            </div>

            <div className="glass-card rounded-2xl p-2 relative overflow-hidden group mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 z-10 
              ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-[0_0_30px_rgba(79,70,229,0.15)] scale-[0.99]' : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                >
                    <input {...getInputProps()} />
                    <div className="mx-auto w-20 h-20 mb-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className={`h-10 w-10 ${isDragActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500 dark:text-indigo-400'}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        {isDragActive ? "Drop media here" : "Drag & drop to upload"}
                    </p>
                    <p className="text-base text-gray-500 dark:text-gray-400">
                        or <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">browse files</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-widest font-semibold">
                        JPG, PNG, MP4, AVI, MOV up to 200MB
                    </p>
                </div>
            </div>

            {file && (
                <div className="glass-card rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="text-green-500 h-6 w-6" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        {!isUploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full"
                                title="Remove file"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {isUploading ? (
                        <div className="w-full">
                            <div className="flex justify-between text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">
                                <span>{progress < 100 ? 'Uploading stream...' : 'Analyzing frames...'}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner flex">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out flex-[0_0_auto]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={uploadFile}
                            className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                        >
                            <UploadCloud className="h-5 w-5" />
                            <span>Run AI Analysis</span>
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50/80 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl flex items-start space-x-3 backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
