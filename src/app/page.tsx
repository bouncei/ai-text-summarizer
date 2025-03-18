"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Copy,
  Check,
  FilePlus,
  RefreshCw,
  Github,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Create a client component wrapper
const SummarizerContent = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium"); // short, medium, long
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // Save state to localStorage
  useEffect(() => {
    const savedText = localStorage.getItem("summarizerInputText");
    const savedSummary = localStorage.getItem("summarizerSummary");
    const savedLength = localStorage.getItem("summarizerLength");

    if (savedText) setInputText(savedText);
    if (savedSummary) setSummary(savedSummary);
    if (savedLength) setSummaryLength(savedLength);
  }, []);

  // Update counts when text changes
  useEffect(() => {
    setCharCount(inputText.length);
    setWordCount(inputText.trim() ? inputText.trim().split(/\s+/).length : 0);

    // Save to localStorage
    localStorage.setItem("summarizerInputText", inputText);
  }, [inputText]);

  // Save summary and length to localStorage
  useEffect(() => {
    if (summary) localStorage.setItem("summarizerSummary", summary);
    localStorage.setItem("summarizerLength", summaryLength);
  }, [summary, summaryLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!inputText.trim()) {
      setError("Please enter some text to summarize.");
      setIsLoading(false);
      return;
    }

    // Check if text is too long (rough estimate: 1 token ≈ 4 chars)
    const estimatedTokenCount = inputText.length / 4;
    if (estimatedTokenCount > 100000) {
      setError(
        "Text is too long. Please reduce the size and try again. (Maximum ~100,000 tokens)"
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          summaryLength,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);
    return readingTime;
  };

  const clearAll = () => {
    setInputText("");
    setSummary("");
    setError("");
    localStorage.removeItem("summarizerInputText");
    localStorage.removeItem("summarizerSummary");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    reader.onerror = () => {
      setError("Error reading file. Please try again.");
    };
    reader.readAsText(file);
  };

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 max-w-4xl"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold text-center mb-8"
        >
          AI Text Summarizer
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 flex flex-wrap gap-2 justify-end"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <FilePlus className="mr-1 h-4 w-4" />
              Upload File
              <input
                id="file-upload"
                type="file"
                accept=".txt,.md,.rtf,.doc,.docx,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Clear All
            </Button>
          </motion.div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="text" className="text-sm font-medium">
              Enter your text to summarize
            </label>
            <Textarea
              id="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text here..."
              className="min-h-[200px]"
              required
            />
            {inputText && (
              <div className="text-xs text-gray-500 flex justify-between">
                <span>
                  ~{calculateReadingTime(inputText)} min read • {wordCount}{" "}
                  words
                </span>
                <span>{charCount} characters</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="summary-length"
                className="text-sm font-medium block mb-2"
              >
                Summary Length
              </label>
              <select
                id="summary-length"
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="short">Short (1-2 paragraphs)</option>
                <option value="medium">Medium (2-3 paragraphs)</option>
                <option value="long">Long (3-4 paragraphs)</option>
              </select>
            </div>
            <div className="flex-1 flex items-end">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  "Generate Summary"
                )}
              </Button>
            </div>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-4 bg-red-50 text-red-700 rounded-md"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mt-8 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Summary</h2>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center gap-1"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </motion.div>
                </div>
                <p className="whitespace-pre-wrap">{summary}</p>
                {summary && (
                  <div className="text-xs text-gray-500 mt-4">
                    ~{calculateReadingTime(summary)} min read •{" "}
                    {summary.trim().split(/\s+/).length} words
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="border-t mt-8 py-4"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Built with ❤️ by{" "}
              <a
                href="https://github.com/bouncei"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Bouncey
                <Github className="h-4 w-4" />
              </a>
            </div>
            <div className="text-sm text-gray-500">
              Powered by OpenAI&apos;s GPT-3.5
            </div>
          </div>
        </div>
      </motion.footer>
    </>
  );
};

// Main page component
export default function Home() {
  return <SummarizerContent />;
}
