const { useState, useEffect, useMemo } = React;
        // --- MAIN APP COMPONENT ---
        const App = () => {
            const [activeStep, setActiveStep] = useState('start');
            const [history, setHistory] = useState([]);
            const [memoData, setMemoData] = useState({ storeName: '', bizNum: '', contact: '', issue: '' });
            const [searchKeyword, setSearchKeyword] = useState('');

            // Supabase State (Hardcoded zero-config setup)
            const [sbConfig, setSbConfig] = useState(() => {
                const saved = localStorage.getItem('cs_guide_sb_config');
                // 한서치 Supabase 정보가 기본값으로 셋팅되도록 변경
                if (saved) return JSON.parse(saved);
                return {
                    url: 'https://trtpgahsnuddenmxuazq.supabase.co',
                    key: 'sb_publishable_N_NBrRMNfUDwfCodR-nZ6g_KCFEZiw1'
                };
            });
            const [isSbModalOpen, setIsSbModalOpen] = useState(false);
            const [isLoadingDb, setIsLoadingDb] = useState(false);
            const supabase = React.useMemo(() => {
                if (sbConfig.url && sbConfig.key && window.supabase) {
                    return window.supabase.createClient(sbConfig.url, sbConfig.key);
                }
                return null;
            }, [sbConfig]);

            const [steps, setSteps] = useState(() => {
                const saved = localStorage.getItem('cs_guide_steps_v9');
                return saved ? JSON.parse(saved) : INITIAL_STEPS;
            });
            const [contents, setContents] = useState(() => {
                const saved = localStorage.getItem('cs_guide_contents_v9');
                return saved ? JSON.parse(saved) : INITIAL_CONTENT;
            });

            const [editMode, setEditMode] = useState(false);
            const [newItem, setNewItem] = useState("");
            const [modalState, setModalState] = useState({ isOpen: false, stepKey: null, choiceIndex: null, data: null });

            const categories = Object.keys(contents).map(key => ({ id: key, title: contents[key].title }));
            const allTargets = [
                ...Object.keys(steps).map(k => ({ id: k, type: 'step', title: steps[k].title })),
                ...Object.keys(contents).map(k => ({ id: k, type: 'result', title: contents[k].title }))
            ];

            // LocalStorage Save Effect (fallback)
            useEffect(() => {
                localStorage.setItem('cs_guide_steps_v9', JSON.stringify(steps));
                localStorage.setItem('cs_guide_contents_v9', JSON.stringify(contents));
            }, [steps, contents]);

            // Database Sync Logic
            const loadFromDB = async (silent = false) => {
                if (!supabase) return silent ? null : alert('먼저 Supabase 연결 설정을 완료해주세요.');
                setIsLoadingDb(true);
                try {
                    const { data, error } = await supabase.from('cs_guide_data').select('*');
                    if (error) throw error;
                    if (data && data.length > 0) {
                        const dbSteps = {}; const dbContents = {};
                        data.forEach(row => {
                            if (row.type === 'step') dbSteps[row.id] = row.data;
                            if (row.type === 'content') dbContents[row.id] = row.data;
                        });
                        if (Object.keys(dbSteps).length > 0) setSteps(dbSteps);
                        if (Object.keys(dbContents).length > 0) setContents(dbContents);
                        if (!silent) alert('DB에서 최신 가이드를 성공적으로 불러왔습니다!');
                    } else {
                        if (!silent) alert('DB에 저장된 데이터가 없습니다.');
                    }
                } catch (err) {
                    console.error(err); if (!silent) alert('불러오기 실패: ' + err.message);
                } finally { setIsLoadingDb(false); }
            };

            // 초기 접속 시 DB에서 자동으로 정보 불러오기
            useEffect(() => {
                if (supabase) {
                    loadFromDB(true);
                }
            }, [supabase]);

            const deployToDB = async () => {
                if (!supabase) return alert('먼저 Supabase 연결 설정을 완료해주세요.');
                if (!confirm('현재 내 PC의 가이드를 DB에 덮어씁니다. 진행할까요?')) return;
                setIsLoadingDb(true);
                try {
                    const payload = [];
                    Object.keys(steps).forEach(k => payload.push({ id: k, type: 'step', data: steps[k] }));
                    Object.keys(contents).forEach(k => payload.push({ id: k, type: 'content', data: contents[k] }));

                    const { error } = await supabase.from('cs_guide_data').upsert(payload);
                    if (error) throw error;
                    alert('모든 가이드가 최신버전으로 DB에 배포되었습니다!');
                } catch (err) {
                    console.error(err); alert('저장 실패: ' + err.message);
                } finally { setIsLoadingDb(false); }
            };

            const navigateTo = (nextStep, choiceLabel) => {
                setHistory(prev => [...prev, { step: activeStep, tag: choiceLabel }]);
                setActiveStep(nextStep);
            };

            const goBack = () => {
                if (history.length > 0) {
                    const prevStep = history[history.length - 1];
                    setHistory(prev => prev.slice(0, -1));
                    setActiveStep(prevStep.step);
                }
            };

            const openChoiceModal = (index = null) => {
                if (index !== null) {
                    setModalState({ isOpen: true, stepKey: activeStep, choiceIndex: index, data: steps[activeStep].choices[index] });
                } else {
                    setModalState({ isOpen: true, stepKey: activeStep, choiceIndex: null, data: null });
                }
            };

            const handleSaveChoice = (choiceData, createNewTarget) => {
                if (createNewTarget) {
                    if (createNewTarget.type === 'Step') {
                        setSteps(prev => ({ ...prev, [createNewTarget.id]: { id: createNewTarget.id, title: createNewTarget.title, description: "새로 추가된 화면입니다.", icon: "star", choices: [] } }));
                    } else {
                        setContents(prev => ({ ...prev, [createNewTarget.id]: { title: createNewTarget.title, icon: "check-circle", type: "success", list: [] } }));
                    }
                }

                setSteps(prev => {
                    const newSteps = { ...prev };
                    const choices = [...newSteps[modalState.stepKey].choices];
                    if (modalState.choiceIndex !== null) {
                        choices[modalState.choiceIndex] = choiceData;
                    } else {
                        choices.push(choiceData);
                    }
                    newSteps[modalState.stepKey].choices = choices;
                    return newSteps;
                });
                setModalState({ isOpen: false, stepKey: null, choiceIndex: null, data: null });
            };

            const handleDeleteChoice = (index) => {
                if (confirm("이 선택지를 삭제할까요?")) {
                    setSteps(prev => {
                        const newSteps = { ...prev };
                        newSteps[activeStep].choices.splice(index, 1);
                        return newSteps;
                    });
                }
            };

            // Existing list manage functions...
            const addItem = (stepKey) => {
                if (!newItem.trim()) return;
                setContents(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], list: [...prev[stepKey].list, newItem.trim()] } }));
                setNewItem("");
            };
            const removeItem = (stepKey, index) => {
                setContents(prev => {
                    const newList = [...prev[stepKey].list];
                    newList.splice(index, 1);
                    return { ...prev, [stepKey]: { ...prev[stepKey], list: newList } };
                });
            };
            const updateItem = (stepKey, index, newText) => {
                setContents(prev => {
                    const newList = [...prev[stepKey].list];
                    newList[index] = newText;
                    return { ...prev, [stepKey]: { ...prev[stepKey], list: newList } };
                });
            };
            const moveOrCopyItem = (sourceKey, targetKey, index, actionType) => {
                setContents(prev => {
                    const newSourceList = [...prev[sourceKey].list];
                    const itemText = newSourceList[index];
                    if (actionType === 'move') newSourceList.splice(index, 1);
                    const newTargetList = [...prev[targetKey].list, itemText];
                    return { ...prev, [sourceKey]: { ...prev[sourceKey], list: newSourceList }, [targetKey]: { ...prev[targetKey], list: newTargetList } };
                });
            };

            const handleCopyMemo = () => {
                const tags = history.filter(h => h.tag && h.tag !== "상황 파악 완료").map(h => h.tag).join(" > ");
                const copyText = `[상담 메모]\n매장명: ${memoData.storeName || '미입력'}\n사업자번호: ${memoData.bizNum || '미입력'}\n연락처: ${memoData.contact || '미입력'}\n문의내용: ${memoData.issue || '미입력'}\n확인경로: ${tags || '없음'}`;
                navigator.clipboard.writeText(copyText).catch(err => console.error('복사 실패:', err));
            };

            const exportToExcel = () => {
                // ... same export ...
                let csvContent = "\uFEFF분류,대응 지침\n";
                Object.keys(contents).forEach(key => {
                    contents[key].list.forEach(item => { csvContent += `"${contents[key].title}","${item.replace(/"/g, '""')}"\n`; });
                });
                const link = document.createElement("a");
                link.setAttribute("href", URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })));
                link.setAttribute("download", "비버웍스_고객상담_대응지침.csv");
                document.body.appendChild(link);
                link.click();
            };

            return (
                <div className="min-h-screen py-10 px-4 flex flex-col items-center max-w-[1200px] mx-auto">
                    {/* 공통 헤더 */}
                    <header className="mb-14 text-center animate-fade-in relative w-full">
                        <div className="absolute right-0 top-0 flex items-center gap-2">
                            {supabase && (
                                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner border border-slate-200">
                                    <button onClick={loadFromDB} disabled={isLoadingDb} className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all flex items-center gap-1"><Icon name="cloud-download" size={14} /> DB동기화</button>
                                    <button onClick={deployToDB} disabled={isLoadingDb} className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-white rounded-xl transition-all flex items-center gap-1"><Icon name="cloud-upload" size={14} /> 배포하기</button>
                                </div>
                            )}
                            <button onClick={() => setIsSbModalOpen(true)} className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-2xl transition-all" title="DB 설정"><Icon name="database" size={20} /></button>
                            <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all ${editMode ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-400'}`}>
                                <Icon name={editMode ? 'check' : 'edit-3'} size={16} /> {editMode ? '편집 모드 완료' : '화면 편집 켜기'}
                            </button>
                        </div>
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-xl shadow-blue-200 mt-2">
                            <Icon name="headset" size={14} /> Technical Support Team
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic">RESPONSE <span className="text-blue-600">GUIDE</span></h1>
                        <p className="text-slate-400 font-bold text-lg">고객상담 스마트 가이드 & 메모 보드</p>
                    </header>

                    <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center flex-grow">
                        {/* Main Content Area */}
                        <div className="w-full flex-1 flex justify-center min-w-0">
                            {steps[activeStep] ? (
                                <Step title={steps[activeStep].title} icon={steps[activeStep].icon} description={steps[activeStep].description} onBack={activeStep !== 'start' ? goBack : undefined}>
                                    {activeStep.includes('category') && (
                                        <div className="w-full max-w-3xl mb-8 relative">
                                            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="순서대로 누르지 않고 바로 증상 검색하기..."
                                                value={searchKeyword}
                                                onChange={e => setSearchKeyword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 bg-white"
                                            />
                                            {searchKeyword.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 max-h-80 overflow-y-auto custom-scrollbar">
                                                    {Object.keys(contents).filter(key =>
                                                        contents[key].title.includes(searchKeyword) ||
                                                        contents[key].list.some(item => item.includes(searchKeyword))
                                                    ).map(k => (
                                                        <button key={k} onClick={() => { setSearchKeyword(''); navigateTo(k, `검색결과: ${contents[k].title}`); }} className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-3 transition-colors">
                                                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl flex-shrink-0">
                                                                <Icon name={contents[k].icon} size={16} />
                                                            </span>
                                                            <div>
                                                                <div className="font-bold text-slate-800 mb-1">{contents[k].title}</div>
                                                                <div className="text-xs text-slate-500 line-clamp-2">{contents[k].list[0]?.split('\n')[0] || '내용 없음'}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {Object.keys(contents).filter(key =>
                                                        contents[key].title.includes(searchKeyword) ||
                                                        contents[key].list.some(item => item.includes(searchKeyword))
                                                    ).length === 0 && (
                                                            <div className="p-4 text-center text-slate-500 text-sm font-bold">검색 결과가 없습니다.</div>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`grid grid-cols-1 ${steps[activeStep].choices.length > 3 ? 'sm:grid-cols-2' : ''} gap-4 w-full max-w-3xl`}>
                                        {steps[activeStep].choices.map((choice, idx) => (
                                            <ChoiceButton
                                                key={choice.id}
                                                label={choice.label}
                                                sublabel={choice.sublabel}
                                                icon={choice.icon}
                                                color={choice.color || "blue"}
                                                onClick={() => {
                                                    if (editMode) {
                                                        openChoiceModal(idx);
                                                    } else {
                                                        navigateTo(choice.target, choice.label);
                                                    }
                                                }}
                                                editMode={editMode}
                                                onEdit={() => openChoiceModal(idx)}
                                                onDelete={() => handleDeleteChoice(idx)}
                                            />
                                        ))}
                                        {editMode && (
                                            <button onClick={() => openChoiceModal(null)} className="h-full min-h-[100px] py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-500 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 flex flex-col justify-center items-center gap-2 transition-all shadow-sm">
                                                <Icon name="plus" size={24} /> <span>선택지 추가하기</span>
                                            </button>
                                        )}
                                    </div>
                                </Step>
                            ) : contents[activeStep] ? (
                                <ResultCard
                                    stepKey={activeStep}
                                    data={contents[activeStep]}
                                    categories={categories}
                                    newItem={newItem}
                                    setNewItem={setNewItem}
                                    addItem={addItem}
                                    removeItem={removeItem}
                                    updateItem={updateItem}
                                    moveOrCopyItem={moveOrCopyItem}
                                    onReset={() => { setMemoData({ storeName: '', bizNum: '', contact: '', issue: '' }); setHistory([]); setActiveStep('start'); }}
                                    onBack={goBack}
                                />
                            ) : (
                                <div className="text-center py-20">
                                    <Icon name="alert-triangle" size={48} className="mx-auto text-rose-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-slate-800">오류가 발생했습니다</h2>
                                    <p className="text-slate-500 mt-2">해당 화면(ID: {activeStep})을 찾을 수 없습니다.</p>
                                    <button onClick={goBack} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">뒤로가기</button>
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Sticky Memo */}
                        <div className="w-full lg:w-[360px] flex-shrink-0 animate-fade-in relative z-10">
                            <div className="sticky top-8 bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <span className="p-2 bg-blue-100 text-blue-600 rounded-full"><Icon name="edit-3" size={18} /></span> 상담 메모
                                    </h3>
                                    <button onClick={handleCopyMemo} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm border border-slate-200 hover:border-blue-600 active:scale-95">
                                        <Icon name="copy" size={14} /> 복사
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">매장명</label>
                                        <input value={memoData.storeName} onChange={e => setMemoData({ ...memoData, storeName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none" placeholder="예: 비버카페 강남점" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">사업자번호</label>
                                        <input value={memoData.bizNum} onChange={e => setMemoData({ ...memoData, bizNum: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none" placeholder="예: 123-45-67890" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">연락처</label>
                                        <input value={memoData.contact} onChange={e => setMemoData({ ...memoData, contact: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none" placeholder="예: 010-1234-5678" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">고객 문의내용</label>
                                        <textarea value={memoData.issue} onChange={e => setMemoData({ ...memoData, issue: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-28 resize-none text-slate-800 placeholder:text-slate-300 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none custom-scrollbar" placeholder="요청 사항을 자유롭게 메모하세요..."></textarea>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">선택한 분류 경로</label>
                                    <div className="flex flex-wrap gap-2">
                                        {history.filter(h => h.tag && h.tag !== "상황 파악 완료").map((h, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-1 shadow-sm"><Icon name="check" size={12} /> {h.tag}</span>
                                        ))}
                                        {history.filter(h => h.tag && h.tag !== "상황 파악 완료").length === 0 && <span className="text-xs text-slate-400 mt-1">아직 선택된 분류가 없습니다.</span>}
                                    </div>
                                </div>

                                <button onClick={() => {
                                    if (confirm('진행 상황과 메모를 모두 초기화하시겠습니까?')) {
                                        setMemoData({ storeName: '', bizNum: '', contact: '', issue: '' });
                                        setHistory([]);
                                        setActiveStep('start');
                                    }
                                }} className="w-full mt-6 py-3.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 group shadow-sm">
                                    <Icon name="rotate-ccw" size={16} className="group-hover:-rotate-180 transition-transform duration-500" /> 상담 종료 / 리셋
                                </button>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-24 w-full border-t border-slate-200 pt-10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                                <Icon name="info" size={16} />
                                <span>장비별 하위 분류 및 모든 항목 편집 기능 장착 완료</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all text-sm shadow-md active:scale-95">
                                    <Icon name="download" size={16} /> 엑셀 파일 다운로드
                                </button>
                            </div>
                        </div>
                    </footer>

                    <ChoiceEditModal
                        isOpen={modalState.isOpen}
                        onClose={() => setModalState({ isOpen: false, stepKey: null, choiceIndex: null, data: null })}
                        choiceData={modalState.data}
                        onSave={handleSaveChoice}
                        allTargets={allTargets}
                    />

                    {/* Supabase 설정 모달 */}
                    {isSbModalOpen && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative">
                                <button onClick={() => setIsSbModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><Icon name="x" size={24} /></button>
                                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Icon name="database" size={24} className="text-emerald-500" /> Database 연결 연결</h2>
                                <p className="text-slate-500 text-sm font-medium mb-6">Supabase URL과 Anon Key를 입력하면 모든 데이터가 데이터베이스에 저장되고 실시간으로 공유됩니다.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Project URL</label>
                                        <input value={sbConfig.url} onChange={e => setSbConfig({ ...sbConfig, url: e.target.value })} className="w-full p-4 border-2 border-slate-200 rounded-2xl text-slate-800 font-mono text-sm focus:border-emerald-500 outline-none" placeholder="https://xxxx.supabase.co" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Project API Key (anon/public)</label>
                                        <input value={sbConfig.key} onChange={e => setSbConfig({ ...sbConfig, key: e.target.value })} className="w-full p-4 border-2 border-slate-200 rounded-2xl text-slate-800 font-mono text-sm focus:border-emerald-500 outline-none" placeholder="eyJhbG..." />
                                    </div>
                                </div>
                                <button onClick={() => {
                                    localStorage.setItem('cs_guide_sb_config', JSON.stringify(sbConfig));
                                    setIsSbModalOpen(false);
                                    alert("설정이 저장되었습니다. 우측 상단의 [DB에서 최신화] 버튼을 눌러보세요.");
                                }} className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">접속 정보 저장</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);