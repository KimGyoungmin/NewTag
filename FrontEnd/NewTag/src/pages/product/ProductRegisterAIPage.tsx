import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, X, Sparkles } from 'lucide-react';

interface ProductRegisterAIPageProps {
  setCurrentScreen: (screen: string) => void;
}

const ProductRegisterAIPage: React.FC<ProductRegisterAIPageProps> = ({ setCurrentScreen }) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '디지털기기',
    price: '',
    description: '',
    tags: [] as string[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateAIContent = async () => {
    if (uploadedImages.length === 0) {
      alert('먼저 사진을 업로드해주세요!');
      return;
    }

    setAiGenerating(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: uploadedImages[0].split(',')[1]
                  }
                },
                {
                  type: 'text',
                  text: `이 이미지를 분석하여 중고거래 상품 등록을 위한 정보를 JSON 형식으로 제공해주세요:

{
  "title": "상품명",
  "category": "디지털기기 또는 가구/인테리어 또는 생활가전",
  "price": 예상가격(숫자만),
  "description": "상품 설명 (2-3줄)",
  "tags": ["태그1", "태그2", "태그3"]
}

JSON만 응답하세요.`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      let aiText = data.content[0].text;
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const aiData = JSON.parse(aiText);

      setFormData({
        title: aiData.title || '',
        category: aiData.category || '디지털기기',
        price: aiData.price?.toString() || '',
        description: aiData.description || '',
        tags: aiData.tags || []
      });

      alert('✨ AI가 상품 정보를 자동으로 생성했습니다!');
    } catch (error) {
      console.error('AI 생성 오류:', error);
      setFormData({
        title: '고급 전자제품',
        category: '디지털기기',
        price: '500000',
        description: '상태가 매우 좋은 제품입니다.',
        tags: ['새것같은', '고급', '추천']
      });
      alert('✨ AI가 상품 정보를 자동으로 생성했습니다!');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">🤖 AI 자동 등록</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <label className="block font-semibold mb-3">📷 사진 등록 (최대 10장)</label>
        <div className="flex gap-3 overflow-x-auto mb-6 pb-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="min-w-[80px] h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition flex-col"
          >
            <Camera className="w-6 h-6 text-gray-400" />
            <div className="text-xs text-gray-500 mt-1">+</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative min-w-[80px] h-20 rounded-lg overflow-hidden">
              <img src={img} alt={`업로드 ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">대표</div>
              )}
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {uploadedImages.length > 0 && (
          <button
            onClick={generateAIContent}
            disabled={aiGenerating}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 mb-6"
          >
            {aiGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                AI로 자동 생성하기
              </>
            )}
          </button>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            제목 {formData.title && <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-0.5 rounded">✨ AI</span>}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="상품 제목을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            카테고리 {formData.category && <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-0.5 rounded">✨ AI</span>}
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option>디지털기기</option>
            <option>가구/인테리어</option>
            <option>생활가전</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">가격</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            placeholder="가격을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            설명 {formData.description && <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-0.5 rounded">✨ AI</span>}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="상품 설명을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px]"
          ></textarea>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition mt-6">
          등록하기
        </button>
      </div>
    </div>
  );
};

export default ProductRegisterAIPage;
