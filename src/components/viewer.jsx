'use client'

import { useState, useRef, useEffect } from 'react';

export default function PDFViewer() {
  const [pdfData, setPdfData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [searchText, setSearchText] = useState('');
  const [highlights, setHighlights] = useState([]);
  const canvasRefs = useRef([]);
  const overlayRefs = useRef([]);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      loadSamplePDF();
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const loadPDFFromStream = async (readableStream) => {
    setLoading(true);
    try {
      // Get a reader from the stream
      const reader = readableStream.getReader();
      
      const chunks = [];
      let totalLength = 0;

      // Read all chunks from the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalLength += value.length;
      }

      // Combine all chunks into a single Uint8Array
      const combinedData = new Uint8Array(totalLength);
      let offset = 0;
      
      chunks.forEach(chunk => {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      });

      const loadingTask = window.pdfjsLib.getDocument({ data: combinedData });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);
      renderAllPages(pdf);
    } catch (error) {
      console.error('Error loading PDF from stream:', error);
      setLoading(false);
    }
  };

  const renderAllPages = async (pdf) => {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      await renderPage(pdf, pageNum);
    }
  };

  const renderPage = async (pdf, pageNum) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale * 1.5 });
    
    const canvas = canvasRefs.current[pageNum - 1];
    if (!canvas) return;

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
  };

  const clearHighlights = () => {
    overlayRefs.current.forEach(overlay => {
      if (overlay) {
        overlay.innerHTML = '';
      }
    });
  };

  const drawTextHighlights = async (pdf, searchLower) => {
    clearHighlights();
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale * 1.5 });
      const textContent = await page.getTextContent();
      
      const overlay = overlayRefs.current[pageNum - 1];
      if (!overlay) continue;

      textContent.items.forEach((item) => {
        const itemText = item.str.toLowerCase();
        if (itemText.includes(searchLower)) {
          const transform = window.pdfjsLib.Util.transform(
            viewport.transform,
            item.transform
          );

          const x = transform[4];
          const y = transform[5];
          const width = item.width * viewport.scale;
          const height = item.height * viewport.scale;

          const highlight = document.createElement('div');
          highlight.style.position = 'absolute';
          highlight.style.left = x + 'px';
          highlight.style.top = (viewport.height - y - height) + 'px';
          highlight.style.width = width + 'px';
          highlight.style.height = height + 'px';
          highlight.style.backgroundColor = 'rgba(255, 235, 59, 0.4)';
          highlight.style.border = '2px solid rgba(255, 193, 7, 0.8)';
          highlight.style.borderRadius = '3px';
          highlight.style.pointerEvents = 'none';
          highlight.style.mixBlendMode = 'multiply';

          overlay.appendChild(highlight);
        }
      });
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderAllPages(pdfDoc);
      if (searchText) {
        drawTextHighlights(pdfDoc, searchText.toLowerCase());
      }
    }
  }, [scale, pdfDoc]);

  const highlightText = async (text) => {
    if (!pdfDoc || !text.trim()) {
      setHighlights([]);
      clearHighlights();
      return;
    }

    const newHighlights = [];
    const searchLower = text.toLowerCase();

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ').toLowerCase();

      if (pageText.includes(searchLower)) {
        newHighlights.push({ pageNum, text });
      }
    }

    setHighlights(newHighlights);
    await drawTextHighlights(pdfDoc, searchLower);
    
    if (newHighlights.length > 0) {
      scrollToPage(newHighlights[0].pageNum);
    }
  };

  const scrollToPage = (pageNum) => {
    const canvas = canvasRefs.current[pageNum - 1];
    if (canvas && containerRef.current) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCurrentPage(pageNum);
    }
  };

  const handleSearch = () => {
    highlightText(searchText);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setHighlights([]);
        clearHighlights();
        setLoading(false);
        renderAllPages(pdf);
      } catch (error) {
        console.error('Error loading uploaded PDF:', error);
        setLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
              
              {totalPages > 0 && (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
              )}

              {highlights.length > 0 && (
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Found in {highlights.length} page{highlights.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-auto"
          style={{ maxHeight: '70vh' }}
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading PDF...</div>
            </div>
          )}
          
          {!loading && totalPages === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-400">
                Upload a PDF file to view
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <div key={i} className="relative">
                <canvas
                  ref={el => canvasRefs.current[i] = el}
                  className={`w-full border rounded ${
                    highlights.some(h => h.pageNum === i + 1)
                      ? 'border-yellow-400 dark:border-yellow-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <div
                  ref={el => overlayRefs.current[i] = el}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />
                {highlights.some(h => h.pageNum === i + 1) && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                    Match found
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}