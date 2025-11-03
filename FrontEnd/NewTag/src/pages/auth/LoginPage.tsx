import React from 'react';
import type { Screen } from '../../types';

interface LoginPageProps {
  setCurrentScreen: (screen: Screen) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setCurrentScreen }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 text-white p-8 flex items-center justify-center" style={{minHeight: '200px'}}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h1 className="text-3xl font-bold">NEWTAG</h1>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">📧 이메일</label>
          <input type="email" placeholder="이메일을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">🔒 비밀번호</label>
          <input type="password" placeholder="비밀번호를 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <button onClick={() => setCurrentScreen('home')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition mb-6">
          로그인 하기
        </button>

        <div className="text-center text-gray-400 mb-6">────── 또는 ──────</div>

        <button className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg mb-3 hover:bg-orange-50 transition">
          🔵 Google로 계속하기
        </button>
        <button className="w-full bg-yellow-300 text-gray-800 py-3 rounded-lg mb-3 hover:bg-yellow-400 transition">
          🟡 Kakao로 계속하기
        </button>
        <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition">
          🟢 Naver로 계속하기
        </button>

        <p className="text-center mt-6 text-gray-600">
          회원이 아니신가요? <span onClick={() => setCurrentScreen('signup')} className="text-orange-500 font-semibold cursor-pointer">회원가입</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
