import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { Screen } from '../../types';

interface SignupPageProps {
  setCurrentScreen: (screen: Screen) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ setCurrentScreen }) => {
  const [checkingNick, setCheckingNick] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [nickAvailable, setNickAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const checkNick = () => {
    setCheckingNick(true);
    setTimeout(() => {
      setNickAvailable(true);
      setCheckingNick(false);
    }, 500);
  };

  const checkEmail = () => {
    setCheckingEmail(true);
    setTimeout(() => {
      setEmailAvailable(true);
      setCheckingEmail(false);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('login')} />
        <h1 className="text-xl font-bold ml-3">회원가입</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이름 *</label>
          <input type="text" placeholder="이름" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">아이디 (닉네임) *</label>
          <div className="flex gap-2">
            <input type="text" placeholder="아이디" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button onClick={checkNick} disabled={checkingNick} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 whitespace-nowrap">
              {checkingNick ? '확인중...' : '중복확인'}
            </button>
          </div>
          {nickAvailable !== null && (
            <p className={`text-sm mt-1 ${nickAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {nickAvailable ? '✓ 사용 가능한 아이디입니다' : '✗ 이미 사용중인 아이디입니다'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이메일 *</label>
          <div className="flex gap-2">
            <input type="email" placeholder="이메일" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button onClick={checkEmail} disabled={checkingEmail} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 whitespace-nowrap">
              {checkingEmail ? '확인중...' : '중복확인'}
            </button>
          </div>
          {emailAvailable !== null && (
            <p className={`text-sm mt-1 ${emailAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {emailAvailable ? '✓ 사용 가능한 이메일입니다' : '✗ 이미 사용중인 이메일입니다'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">비밀번호 *</label>
          <input type="password" placeholder="비밀번호" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">비밀번호 확인 *</label>
          <input type="password" placeholder="비밀번호 확인" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">전화번호</label>
          <input type="tel" placeholder="010-0000-0000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">생년월일</label>
          <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <button onClick={() => setCurrentScreen('home')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
          가입하기
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
