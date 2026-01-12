import React, { useState } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Call the real backend endpoint
            const res = await api.post('/import/leads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult({
                success: true,
                message: `Success! ${res.data.message}`
            });

        } catch (error: any) {
            console.error('Upload failed:', error);
            setResult({
                success: false,
                message: error.response?.data?.error || 'Upload failed. Please check your file format.'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Import Leads</h1>

            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:bg-gray-50 transition">
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="font-bold text-lg mb-2">Upload CSV or Excel</h3>
                    <p className="text-gray-500 text-sm mb-6">Drag and drop your lead file here</p>

                    <input
                        type="file"
                        accept=".csv, .xlsx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="px-6 py-3 bg-neon-pink text-black font-bold rounded-lg cursor-pointer hover:bg-pink-400"
                    >
                        Select File
                    </label>
                </div>

                {file && (
                    <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                            <FileUp className="text-gray-500 mr-3" />
                            <span className="font-medium">{file.name}</span>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="px-4 py-2 bg-black text-white rounded font-bold hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isUploading ? 'Uploading...' : 'Process Import'}
                        </button>
                    </div>
                )}

                {result && (
                    <div className={`mt-6 p-4 rounded-lg flex items-center ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {result.success ? <CheckCircle className="mr-3" /> : <AlertCircle className="mr-3" />}
                        <div>
                            <p className="font-bold">{result.success ? 'Import Completed' : 'Import Failed'}</p>
                            <p className="text-sm">{result.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
