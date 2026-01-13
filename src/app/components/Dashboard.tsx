'use client';

import { useState } from 'react';
import Link from 'next/link';
import SyncButton from '@/app/components/SyncButton';

interface Bid {
    bid_no: string;
    title: string;
    url: string;
    date: string;
    agency: string;
    type: string;
    created_at: string;
    // For Openings
    winner?: string;
    price?: string;
}

interface DashboardProps {
    bids: Bid[];
    openings: Bid[];
}

export default function Dashboard({ bids, openings }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'bids' | 'openings'>('bids');
    const [selectedAgency, setSelectedAgency] = useState<string>('all');

    const data = activeTab === 'bids' ? bids : openings;

    // Get unique agencies for filter
    const uniqueAgencies = Array.from(new Set(data.map(item => item.agency).filter(Boolean)));

    const filteredData = selectedAgency === 'all'
        ? data
        : data.filter(item => item.agency === selectedAgency);

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const newTodayCount = data.filter(a => a.date && a.date.startsWith(today)).length;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">나라장터 알리미</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-gray-500 text-sm">대상: 국토지리정보원, 국립해양조사원, 산림청, 국립산림과학원</p>
                            <div className="flex gap-2">
                                <Link href="/report" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
                                    📊 보고서
                                </Link>
                                <SyncButton />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">총 수집</p>
                            <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                        </div>
                        <div className="text-center border-l pl-6">
                            <p className="text-sm text-gray-500">오늘 {activeTab === 'bids' ? '입찰공고' : '개찰결과'}</p>
                            <p className="text-2xl font-bold text-green-600">{newTodayCount}</p>
                        </div>
                    </div>
                </header>

                {/* Controls */}
                <div className="flex justify-between items-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setActiveTab('bids')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bids' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            입찰공고
                        </button>
                        <button
                            onClick={() => setActiveTab('openings')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'openings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            개찰 목록
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium mr-1">기관 필터:</span>
                        <button
                            onClick={() => setSelectedAgency('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAgency === 'all'
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            전체
                        </button>
                        {uniqueAgencies.map(agency => (
                            <button
                                key={agency}
                                onClick={() => setSelectedAgency(agency)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAgency === agency
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {agency}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">{activeTab === 'bids' ? '진행일자' : '개찰일자'}</th>
                                    <th className="px-6 py-4">공고명</th>
                                    <th className="px-6 py-4">수요기관</th>
                                    <th className="px-6 py-4">구분</th>
                                    {activeTab === 'openings' && <th className="px-6 py-4">낙찰자/금액</th>}
                                    <th className="px-6 py-4">링크</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'openings' ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                                            데이터가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.bid_no} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-900">
                                                {item.date ? new Date(item.date).toLocaleString('ko-KR') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.title}</div>
                                                <div className="text-xs text-gray-400 mt-1">{item.bid_no}</div>
                                            </td>
                                            <td className="px-6 py-4">{item.agency}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium leading-none whitespace-nowrap ${item.type === 'service'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : item.type === 'opening' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                        }`}
                                                >
                                                    {item.type === 'service' ? '용역' : item.type === 'opening' ? '개찰' : '물품'}
                                                </span>
                                            </td>
                                            {activeTab === 'openings' && (
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-900 font-medium">{item.winner || '-'}</div>
                                                    <div className="text-xs text-gray-500">{item.price ? Number(item.price).toLocaleString() + '원' : '-'}</div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    바로가기 &rarr;
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
