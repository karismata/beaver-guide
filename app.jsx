

const { useState, useEffect, useMemo, useRef } = React;

const PREDEFINED_SOLUTIONS = [
    { id: '비버', color: 'blue' },
    { id: '우노스', color: 'green' },
    { id: '오더퀸', color: 'pink' },
    { id: '빽다방', color: 'yellow' },
    { id: 'OKPOS', color: 'orange' },
    { id: '이지POS', color: 'purple' }
];

const getSolColorClasses = (color, isActive) => {
    if (!isActive) {
        return 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 shadow-sm';
    }
    switch (color) {
        case 'blue': return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/30';
        case 'green': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/30';
        case 'pink': return 'bg-pink-500 text-white border-pink-600 shadow-pink-500/30';
        case 'yellow': return 'bg-yellow-500 text-white border-yellow-600 shadow-yellow-500/30';
        case 'orange': return 'bg-orange-500 text-white border-orange-600 shadow-orange-500/30';
        case 'purple': return 'bg-purple-500 text-white border-purple-600 shadow-purple-500/30';
        default: return 'bg-slate-500 text-white border-slate-600 shadow-slate-500/30';
    }
};

// --- MAIN APP COMPONENT ---
const App = () => {
    const [activeStep, setActiveStep] = useState('start');
    const [history, setHistory] = useState([]);
    const [memoData, setMemoData] = useState({ dbId: null, storeName: '', bizNum: '', contact: '', usedSolution: '', issue: '' });
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isMemoSearch, setIsMemoSearch] = useState(false);

    // 자연어 처리 도우미 (조사 및 어미 제거)
    const parseKeywords = (text) => {
        if (!text) return [];
        const suffixes = ['은', '는', '이', '가', '을', '를', '에', '에게', '에서', '로', '으로', '와', '과', '도', '만', '요', '습니다', '합니다', '입니다', '돼요', '되나요', '해', '해줘', '안돼요', '안됨'];
        return text.toLowerCase().replace(/[?!.,'"]/g, ' ').split(/\s+/).map(w => {
            for (let s of suffixes.sort((a, b) => b.length - a.length)) {
                if (w.endsWith(s) && w.length > s.length) return w.slice(0, -s.length);
            }
            return w;
        }).filter(w => w.length > 1 || text.split(/\s+/).length === 1);
        // 키워드가 여러개일땐 1글자짜리 조각(예: "안", "수") 무시. 단, 원래 검색어가 1단어면 그대로 허용.
    };

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('cs_guide_dark_mode') === 'true';
    });
    const [memoPosition, setMemoPosition] = useState(() => {
        return localStorage.getItem('cs_guide_memo_pos') || 'right';
    });
    const [useManualMemoSearch, setUseManualMemoSearch] = useState(() => {
        return localStorage.getItem('cs_guide_manual_memo_search') === 'true';
    });
    const [useAutoMemoSearch, setUseAutoMemoSearch] = useState(() => {
        return localStorage.getItem('cs_guide_auto_memo_search') === 'true';
    });
    const [newItem, setNewItem] = useState("");
    const [modalState, setModalState] = useState({ isOpen: false, stepKey: null, choiceIndex: null, data: null });
    const [isLocalChange, setIsLocalChange] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [isSolutionExpanded, setIsSolutionExpanded] = useState(false);
    const [isStoreSettingsExpanded, setIsStoreSettingsExpanded] = useState(false);
    const [storeSelectModal, setStoreSelectModal] = useState({ isOpen: false, stores: [] });

    // Store autocomplete state
    const [storeSuggestions, setStoreSuggestions] = useState([]);
    const [isStoreSuggestionOpen, setIsStoreSuggestionOpen] = useState(false);
    const storeSuggestionRef = useRef(null);

    const solutionDropdownRef = useRef(null);
    const storeSettingsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (solutionDropdownRef.current && !solutionDropdownRef.current.contains(event.target)) {
                setIsSolutionExpanded(false);
            }
            if (storeSettingsRef.current && !storeSettingsRef.current.contains(event.target)) {
                setIsStoreSettingsExpanded(false);
            }
            if (storeSuggestionRef.current && !storeSuggestionRef.current.contains(event.target)) {
                setIsStoreSuggestionOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const categories = Object.keys(contents).map(key => ({ id: key, title: contents[key].title }));
    const allTargets = [
        ...Object.keys(steps).map(k => ({ id: k, type: 'step', title: steps[k].title })),
        ...Object.keys(contents).map(k => ({ id: k, type: 'result', title: contents[k].title }))
    ];

    // Persist memo position & features
    useEffect(() => {
        localStorage.setItem('cs_guide_memo_pos', memoPosition);
    }, [memoPosition]);
    useEffect(() => {
        localStorage.setItem('cs_guide_manual_memo_search', useManualMemoSearch);
    }, [useManualMemoSearch]);
    useEffect(() => {
        localStorage.setItem('cs_guide_auto_memo_search', useAutoMemoSearch);
    }, [useAutoMemoSearch]);

    // Store Auto Complete
    useEffect(() => {
        if (!supabase) return;
        const text = memoData.storeName.trim();
        if (text.length < 2) {
            setStoreSuggestions([]);
            setIsStoreSuggestionOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            // Only search if active element is the input itself (prevent search loop on selection)
            if (document.activeElement?.id !== 'memo-storeName') return;
            try {
                const terms = text.split(' ').filter(Boolean);
                let query = supabase.from('store_directory').select('*');
                terms.forEach(term => {
                    query = query.ilike('store_name', `%${term}%`);
                });
                query = query.limit(10);

                const { data, error } = await query;
                if (!error && data) {
                    setStoreSuggestions(data);
                    setIsStoreSuggestionOpen(data.length > 0);
                }
            } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(timer);
    }, [memoData.storeName, supabase]);

    // Auto memo search logic
    useEffect(() => {
        if (!useAutoMemoSearch) return;
        const text = memoData.issue.trim();
        const timer = setTimeout(() => {
            if (text.length >= 2 && text !== searchKeyword) {
                setIsMemoSearch(true);
                setSearchKeyword(text);
                setActiveStep('__search__');
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [memoData.issue, useAutoMemoSearch, searchKeyword]);

    // Apply and Persist dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            // document.body.classList.add('bg-slate-900'); // set globally if not overridden
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('cs_guide_dark_mode', isDarkMode);
    }, [isDarkMode]);

    // LocalStorage Save Effect (fallback)
    useEffect(() => {
        const localContents = {};
        Object.keys(contents).forEach(k => {
            if (!k.startsWith('info_')) localContents[k] = contents[k];
        });
        localStorage.setItem('cs_guide_steps_v9', JSON.stringify(steps));
        localStorage.setItem('cs_guide_contents_v9', JSON.stringify(localContents));

        if (isLocalChange) {
            const autoDeploy = async () => {
                if (!supabase) return;
                setIsLoadingDb(true);
                try {
                    const payload = [];
                    Object.keys(steps).forEach(k => payload.push({ id: k, type: 'step', data: steps[k] }));
                    Object.keys(contents).forEach(k => {
                        if (!k.startsWith('info_')) {
                            payload.push({ id: k, type: 'content', data: contents[k] });
                        }
                    });
                    await supabase.from('cs_guide_data').upsert(payload);
                } catch (err) { console.error('Auto deploy failed:', err); }
                setIsLoadingDb(false);
            };
            autoDeploy();
            setIsLocalChange(false);
        }
    }, [steps, contents, isLocalChange, supabase]);

    // Database Sync Logic
    const loadFromDB = async (silent = false) => {
        if (!supabase) return silent ? null : alert('먼저 Supabase 연결 설정을 완료해주세요.');
        setIsLoadingDb(true);
        try {
            const { data, error } = await supabase.from('cs_guide_data').select('*');
            if (error) throw error;

            // 한서치 info 데이터 불러오기
            const { data: infoData, error: infoError } = await supabase.from('info').select('*').order('id', { ascending: false });

            if (data && data.length > 0) {
                const dbSteps = {}; const dbContents = {};
                data.forEach(row => {
                    if (row.type === 'step') dbSteps[row.id] = row.data;
                    if (row.type === 'content') dbContents[row.id] = row.data;
                });

                // 한서치 info 데이터를 contents에 병합
                if (!infoError && infoData) {
                    infoData.forEach(row => {
                        dbContents[`info_${row.id}`] = {
                            isInfo: true,
                            title: `[H] ${row['키워드2'] || row['키워드']}`,
                            programKey: row['키워드'] || '공통',
                            icon: "book-open",
                            type: "info",
                            list: [(row['내용'] || '').replace(/\/n/g, '\n').replace(/\\n/g, '\n').replace(/~n/g, '\n').replace(/NL/gi, '\n').replace(/␤/g, '\n')],
                            image: row['이미지들']
                        };
                    });
                }

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


    const [searchExpandedIdx, setSearchExpandedIdx] = useState(null);

    const navigateTo = (nextStep, choiceLabel, expandIdx = null) => {
        setHistory(prev => [...prev, { step: activeStep, tag: choiceLabel }]);
        setActiveStep(nextStep);
        setSearchExpandedIdx(expandIdx);
    };

    const goBack = () => {
        if (history.length > 0) {
            const prevStep = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setActiveStep(prevStep.step);
            setSearchExpandedIdx(null);
        } else {
            setActiveStep('start');
            setSearchExpandedIdx(null);
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
        setIsLocalChange(true);
    };

    const handleDeleteChoice = (index) => {
        if (confirm("이 선택지를 삭제할까요?")) {
            setSteps(prev => {
                const newSteps = { ...prev };
                newSteps[activeStep].choices.splice(index, 1);
                return newSteps;
            });
            setIsLocalChange(true);
        }
    };

    // Existing list manage functions...
    const addItem = (stepKey) => {
        if (!newItem.trim()) return;
        setContents(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], list: [...prev[stepKey].list, newItem.trim()] } }));
        setNewItem("");
        setIsLocalChange(true);
    };
    const removeItem = (stepKey, index) => {
        setContents(prev => {
            const newList = [...prev[stepKey].list];
            newList.splice(index, 1);
            return { ...prev, [stepKey]: { ...prev[stepKey], list: newList } };
        });
        setIsLocalChange(true);
    };
    const updateItem = (stepKey, index, newText) => {
        setContents(prev => {
            const newList = [...prev[stepKey].list];
            newList[index] = newText;
            return { ...prev, [stepKey]: { ...prev[stepKey], list: newList } };
        });
        setIsLocalChange(true);
    };
    const moveOrCopyItem = (sourceKey, targetKey, index, actionType) => {
        setContents(prev => {
            const newSourceList = [...prev[sourceKey].list];
            const itemText = newSourceList[index];
            if (actionType === 'move') newSourceList.splice(index, 1);
            const newTargetList = [...prev[targetKey].list, itemText];
            return { ...prev, [sourceKey]: { ...prev[sourceKey], list: newSourceList }, [targetKey]: { ...prev[targetKey], list: newTargetList } };
        });
        setIsLocalChange(true);
    };

    const formatBizNum = (val) => {
        const raw = val.replace(/[^0-9]/g, '');
        if (raw.length <= 3) return raw;
        if (raw.length <= 5) return raw.slice(0, 3) + '-' + raw.slice(3);
        return raw.slice(0, 3) + '-' + raw.slice(3, 5) + '-' + raw.slice(5, 10);
    };

    const formatContact = (val) => {
        const raw = val.replace(/[^0-9]/g, '');
        if (raw.length <= 2) return raw;
        if (raw.startsWith('02')) {
            if (raw.length <= 5) return raw.slice(0, 2) + '-' + raw.slice(2);
            if (raw.length <= 9) return raw.slice(0, 2) + '-' + raw.slice(2, 5) + '-' + raw.slice(5);
            return raw.slice(0, 2) + '-' + raw.slice(2, 6) + '-' + raw.slice(6, 10);
        } else if (raw.startsWith('15') || raw.startsWith('16') || raw.startsWith('18')) {
            if (raw.length <= 4) return raw;
            return raw.slice(0, 4) + '-' + raw.slice(4, 8);
        } else {
            if (raw.length <= 3) return raw;
            if (raw.length <= 6) return raw.slice(0, 3) + '-' + raw.slice(3);
            if (raw.length <= 10) return raw.slice(0, 3) + '-' + raw.slice(3, 6) + '-' + raw.slice(6);
            return raw.slice(0, 3) + '-' + raw.slice(3, 7) + '-' + raw.slice(7, 11);
        }
    };

    const handleCopyMemo = () => {
        const solutionText = memoData.usedSolution ? `${memoData.usedSolution}\n` : '';
        const copyText = `${solutionText}매장명: ${memoData.storeName || '미입력'}\n사업자번호: ${memoData.bizNum || '미입력'}\n연락처: ${memoData.contact || '미입력'}\n문의내용: ${memoData.issue || '미입력'}`;
        navigator.clipboard.writeText(copyText).catch(err => console.error('복사 실패:', err));
    };

    const handleSearchStore = async () => {
        if (!supabase) {
            alert("Supabase 데이터베이스가 연결되어 있지 않습니다. 관리자 도구에서 연결해주세요.");
            return;
        }
        const bn = memoData.bizNum ? memoData.bizNum.replace(/[^0-9]/g, '') : '';
        const sn = memoData.storeName ? memoData.storeName.trim() : '';

        if (bn.length < 10 && !sn) {
            alert("검색할 매장명 또는 사업자 번호(10자리)를 입력해주세요.");
            return;
        }

        try {
            let query = supabase.from('store_directory').select('*');
            const snTerms = sn.split(' ').filter(Boolean);
            const snCondition = snTerms.length > 0 ? (snTerms.length === 1 ? `store_name.ilike.%${snTerms[0]}%` : `and(${snTerms.map(t => `store_name.ilike.%${t}%`).join(',')})`) : '';

            if (bn.length >= 10 && snTerms.length > 0) {
                query = query.or(`biz_num.eq.${bn},${snCondition}`);
            } else if (bn.length >= 10) {
                query = query.eq('biz_num', bn);
            } else if (snTerms.length > 0) {
                snTerms.forEach(t => {
                    query = query.ilike('store_name', `%${t}%`);
                });
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                alert("DB에 매장 정보가 없습니다. 매장명과 솔루션을 입력 후 저장 버튼을 눌러주세요.");
            } else if (data.length === 1) {
                const store = data[0];
                setMemoData(prev => ({
                    ...prev,
                    dbId: store.id,
                    bizNum: prev.bizNum || formatBizNum(store.biz_num),
                    storeName: store.store_name || prev.storeName,
                    usedSolution: store.used_solution || prev.usedSolution,
                }));
            } else {
                setStoreSelectModal({ isOpen: true, stores: data });
            }
        } catch (e) {
            alert("DB에 매장 정보 조회 중 오류가 발생했습니다.");
            console.error(e);
        }
    };

    const handleSaveStore = async () => {
        if (!supabase) {
            alert("Supabase 데이터베이스가 연결되어 있지 않습니다.");
            return;
        }
        const bn = memoData.bizNum.replace(/[^0-9]/g, '');
        if (bn.length < 10) {
            alert("정확한 사업자 번호(10자리)를 입력해주세요.");
            return;
        }
        if (!memoData.storeName.trim()) {
            alert("저장할 매장명을 입력해주세요.");
            return;
        }

        try {
            if (memoData.dbId) {
                const { error } = await supabase.from('store_directory').update({
                    store_name: memoData.storeName.trim(),
                    used_solution: memoData.usedSolution.trim(),
                }).eq('id', memoData.dbId);

                if (error) throw error;
                alert("DB에 매장 정보가 성공적으로 업데이트 되었습니다!");
            } else {
                const { error } = await supabase.from('store_directory').insert({
                    biz_num: bn,
                    store_name: memoData.storeName.trim(),
                    used_solution: memoData.usedSolution.trim(),
                });

                if (error) throw error;
                alert("새로운 매장 정보가 DB에 성공적으로 저장되었습니다!");
            }
        } catch (e) {
            alert("매장 정보 저장에 실패했습니다. (DB 테이블 store_directory 속성을 확인하세요)");
            console.error(e);
        }
    };

    const handleDeleteStore = async () => {
        if (!supabase) return;
        if (!memoData.dbId) {
            alert("현재 등록된 매장 정보가 아닙니다. (매칭된 매장만 삭제 가능)");
            return;
        }
        if (!confirm(`정말 [${memoData.storeName}] 매장을 DB에서 삭제하시겠습니까?`)) return;

        try {
            const { error } = await supabase.from('store_directory').delete().eq('id', memoData.dbId);
            if (error) throw error;
            alert("매장 정보가 DB에서 완전히 삭제되었습니다.");
            setMemoData(prev => ({ ...prev, dbId: null, storeName: '', usedSolution: '' }));
        } catch (e) {
            alert("매장 삭제 중 오류가 발생했습니다.");
            console.error(e);
        }
    };

    const exportToExcel = () => {
        // ... same export ...
        let csvContent = "\uFEFF분류,대응 지침\n";
        Object.keys(contents).forEach(key => {
            if (key.startsWith('info_')) return;
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
            <header className="mb-14 text-center animate-fade-in relative w-full pt-4">
                <div className="absolute right-0 top-0 flex items-center gap-2">
                    <button
                        onClick={() => setGuideStep(1)}
                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all shadow-sm flex items-center gap-2 font-black text-sm active:scale-95 z-50 relative"
                        title="스마트 기능 가이드"
                    >
                        <Icon name="help-circle" size={18} />
                        <span className="hidden sm:inline">사용 방법 안내</span>
                    </button>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm active:scale-95 z-50 relative"
                        title="다크모드 전환"
                    >
                        <Icon name={isDarkMode ? 'sun' : 'moon'} size={18} />
                    </button>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-xl shadow-blue-200 mt-2">
                    <Icon name="headset" size={14} /> Technical Support Team
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter italic">RESPONSE <span className="text-blue-600">GUIDE</span></h1>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-lg">고객상담 스마트 가이드 & 메모 보드</p>
            </header>

            <div className={`w-full flex flex-col gap-8 items-start justify-center flex-grow ${memoPosition === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                {/* Main Content Area */}
                <div className="w-full flex-1 flex justify-center min-w-0">
                    {activeStep === '__search__' ? (
                        <div className="w-full max-w-3xl animate-fade-in">
                            <div className={`flex items-center gap-4 mb-6 ${memoPosition === 'left' ? 'justify-between flex-row-reverse' : 'justify-start'}`}>
                                <button onClick={goBack} className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold flex items-center shadow-sm">
                                    <Icon name="arrow-left" size={20} className="mr-2" /> 뒤로
                                </button>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Icon name="search" size={24} /></div>
                                    "{searchKeyword}" 검색 결과 모아보기
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {(() => {
                                    let matches = [];
                                    const rawKeywords = searchKeyword.toLowerCase().split(/[,\s]+/).filter(w => w.length > 0);
                                    const parsedKeywords = parseKeywords(searchKeyword);
                                    const keywords = isMemoSearch ? parsedKeywords : rawKeywords;

                                    if (keywords.length === 0) return null;

                                    Object.keys(contents).forEach(k => {
                                        const c = contents[k];

                                        // 한서치 데이터 필터링 로직: 선택된 장비 카테고리에 속한 정보만 노출
                                        if (c.isInfo && c.programKey) {
                                            const selectedPrograms = history.map(h => h.tag).filter(tag => tag && tag !== "상황 파악 완료");
                                            if (selectedPrograms.length > 0) {
                                                const isMatched = selectedPrograms.some(tag =>
                                                    tag.includes(c.programKey) ||
                                                    c.programKey === '공통' ||
                                                    c.programKey.toLowerCase() === 'all'
                                                );
                                                if (!isMatched) return; // 일치하지 않으면 무시하고 다음 데이터로
                                            }
                                        }

                                        let titleMatchCount = keywords.filter(kw => c.title.toLowerCase().includes(kw)).length;

                                        if (titleMatchCount > 0 && c.list.length === 0) {
                                            matches.push({ contentKey: k, title: c.title, icon: c.icon, type: c.type, matchScore: titleMatchCount, isTitleMatch: true, image: c.image, isInfo: c.isInfo });
                                        }

                                        let itemMatched = false;
                                        c.list.forEach((item, idx) => {
                                            if (!item) return;
                                            let itemMatchCount = keywords.filter(kw => item.toLowerCase().includes(kw) || c.title.toLowerCase().includes(kw)).length;

                                            if (itemMatchCount > 0) {
                                                matches.push({ contentKey: k, title: c.title, icon: c.icon, type: c.type, item, matchIdx: idx, image: idx === 0 ? c.image : null, isInfo: c.isInfo, matchScore: itemMatchCount });
                                                itemMatched = true;
                                            }
                                        });

                                        if (titleMatchCount > 0 && !itemMatched && c.list.length > 0) {
                                            matches.push({ contentKey: k, title: c.title, icon: c.icon, type: c.type, item: c.list[0], matchIdx: 0, image: c.image, isInfo: c.isInfo, matchScore: titleMatchCount });
                                        }
                                    });

                                    // 3단계 검색 전략 적용 (메모 검색일 때만 점진적 완화)
                                    if (isMemoSearch) {
                                        const exactMatches = matches.filter(m => m.matchScore === keywords.length);
                                        if (exactMatches.length > 0) {
                                            matches = exactMatches;
                                        } else {
                                            const partialMatches = matches.filter(m => m.matchScore >= Math.ceil(keywords.length * 0.5));
                                            if (partialMatches.length > 0) {
                                                matches = partialMatches.sort((a, b) => b.matchScore - a.matchScore);
                                            } else {
                                                matches = matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5); // 연관성 높은 최대 5개 노출
                                            }
                                        }
                                    } else {
                                        // 일반 검색 (모두 포함 AND 강제)
                                        matches = matches.filter(m => m.matchScore === keywords.length);
                                    }

                                    // 중복 제거
                                    const uniqueMatches = [];
                                    const seen = new Set();
                                    for (let m of matches) {
                                        const uid = m.contentKey + '_' + (m.matchIdx !== undefined ? m.matchIdx : '');
                                        if (!seen.has(uid)) {
                                            seen.add(uid);
                                            uniqueMatches.push(m);
                                        }
                                    }

                                    if (uniqueMatches.length === 0) {
                                        return <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm"><Icon name="search-x" size={48} className="mx-auto text-slate-300 dark:text-slate-400 mb-4" /><p className="text-slate-500 dark:text-slate-400 font-bold text-lg">일치하는 결과가 없습니다.</p></div>;
                                    }

                                    return uniqueMatches.map((m, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl p-6 hover:border-blue-300 transition-all text-left cursor-pointer group" onClick={() => { navigateTo(m.contentKey, `검색결과: ${m.title}`, m.matchIdx !== undefined ? m.matchIdx : 0); }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`p-2 rounded-xl transition-colors ${m.type === 'success' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : m.type === 'info' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'}`}>
                                                    <Icon name={m.icon} size={20} />
                                                </span>
                                                <span className="font-black text-slate-800 dark:text-slate-100 text-xl group-hover:text-blue-600 transition-colors">{m.title}</span>
                                            </div>
                                            {m.item ? (
                                                <div className="pl-14">
                                                    <p className="text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed line-clamp-4">
                                                        {m.item}
                                                    </p>
                                                    {m.image && m.matchIdx === 0 && (
                                                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                            <img src={m.image} className="w-full max-h-48 object-cover bg-slate-50 dark:bg-slate-900 dark:bg-slate-700" alt="첨부 이미지" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="pl-14 text-slate-400 dark:text-slate-500 text-sm font-bold italic">문서 제목이 검색어와 일치합니다.</p>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    ) : steps[activeStep] ? (
                        <Step title={steps[activeStep].title} icon={steps[activeStep].icon} description={steps[activeStep].description} onBack={activeStep !== 'start' ? goBack : undefined} memoPosition={memoPosition}>
                            {(activeStep === 'start' || activeStep.includes('category')) && (
                                <div className={`w-full max-w-3xl mb-8 relative transition-all ${guideStep === 4 ? 'z-[101] ring-4 ring-indigo-500/50 ring-offset-8 ring-offset-slate-50 dark:ring-offset-slate-900 rounded-2xl bg-white dark:bg-slate-800' : ''}`}>
                                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="어떤 문제가 발생했나요? (검색어 입력 후 Enter)"
                                        value={searchKeyword}
                                        onChange={e => { setSearchKeyword(e.target.value); setIsMemoSearch(false); }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && searchKeyword.trim().length > 0) {
                                                setIsMemoSearch(false);
                                                navigateTo('__search__', `검색: ${searchKeyword}`);
                                            }
                                        }}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                                    />
                                    {guideStep === 4 && (
                                        <div className="absolute top-full left-0 mt-6 w-full max-w-md animate-fade-in-up bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-6 z-[102] before:content-[''] before:absolute before:-top-3 before:left-8 before:border-8 before:border-transparent before:border-b-indigo-500">
                                            <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2"><Icon name="search" size={20} /> 강력한 다중 단어 검색</h3>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                메인 검색창에서는 띄어쓰기로 여러 단어를 입력하면 <strong>입력한 모든 단어가 들어있는 문서(AND)</strong>만 정확하게 쏙쏙 뽑아 보여줍니다.
                                            </p>
                                            <div className="mt-5 flex justify-end">
                                                <button onClick={() => setGuideStep(0)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 hover:bg-indigo-700">투어 종료하기</button>
                                            </div>
                                        </div>
                                    )}
                                    {searchKeyword.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-20 max-h-80 overflow-y-auto custom-scrollbar">
                                            {(() => {
                                                const getScopeContentKeys = (stepKey) => {
                                                    const keys = new Set();
                                                    const traverse = (key) => {
                                                        if (contents[key]) {
                                                            keys.add(key);
                                                        } else if (steps[key] && steps[key].choices) {
                                                            steps[key].choices.forEach(c => traverse(c.target));
                                                        }
                                                    };
                                                    traverse(stepKey);
                                                    return Array.from(keys);
                                                };

                                                const scopeKeys = activeStep === 'start' ? [] : getScopeContentKeys(activeStep);
                                                const allSearchableKeys = activeStep === 'start' ? Object.keys(contents) : [
                                                    ...scopeKeys,
                                                    ...Object.keys(contents).filter(k => k.startsWith('info_') && !scopeKeys.includes(k))
                                                ];

                                                const keywords = searchKeyword.toLowerCase().split(/[,\s]+/).filter(w => w.length > 0);
                                                if (keywords.length === 0) return null;

                                                const results = allSearchableKeys.filter(key =>
                                                    keywords.every(kw =>
                                                        contents[key].title.toLowerCase().includes(kw) ||
                                                        contents[key].list.some(item => item && item.toLowerCase().includes(kw))
                                                    )
                                                );

                                                if (results.length === 0) {
                                                    return <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm font-bold">검색 결과가 없습니다.</div>;
                                                }

                                                return results.map(k => {
                                                    const matchIdx = contents[k].list.findIndex(item => item && keywords.every(kw => item.toLowerCase().includes(kw) || contents[k].title.toLowerCase().includes(kw)));
                                                    return (
                                                        <button key={k} onClick={() => { setSearchKeyword(''); navigateTo(k, `검색결과: ${contents[k].title}`, matchIdx !== -1 ? matchIdx : 0); }} className="w-full text-left p-4 hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-start gap-3 transition-colors">
                                                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl flex-shrink-0">
                                                                <Icon name={contents[k].icon} size={16} />
                                                            </span>
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-slate-100 mb-1">{contents[k].title}</div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{contents[k].list[matchIdx !== -1 ? matchIdx : 0]?.split('\n')[0] || '내용 없음'}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                            {!(useManualMemoSearch && activeStep === 'start') && (
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
                                        <button onClick={() => openChoiceModal(null)} className="h-full min-h-[100px] py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-500 dark:text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 flex flex-col justify-center items-center gap-2 transition-all shadow-sm">
                                            <Icon name="plus" size={24} /> <span>선택지 추가하기</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </Step>
                    ) : contents[activeStep] ? (
                        <ResultCard
                            stepKey={activeStep}
                            data={contents[activeStep]}
                            categories={categories}
                            memoPosition={memoPosition}
                            newItem={newItem}
                            setNewItem={setNewItem}
                            addItem={addItem}
                            removeItem={removeItem}
                            updateItem={updateItem}
                            moveOrCopyItem={moveOrCopyItem}
                            onReset={() => { setMemoData({ dbId: null, storeName: '', bizNum: '', contact: '', usedSolution: '', issue: '' }); setHistory([]); setActiveStep('start'); setSearchKeyword(''); setIsMemoSearch(false); setSearchExpandedIdx(null); }}
                            onBack={goBack}
                            defaultExpandedIdx={searchExpandedIdx}
                        />
                    ) : (
                        <div className="text-center py-20">
                            <Icon name="alert-triangle" size={48} className="mx-auto text-rose-500 mb-4" />
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">오류가 발생했습니다</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">해당 화면(ID: {activeStep})을 찾을 수 없습니다.</p>
                            <button onClick={goBack} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">뒤로가기</button>
                        </div>
                    )}
                </div>

                {/* Right Panel - Sticky Memo */}
                {memoPosition !== 'hidden' && (
                    <div className="w-full lg:w-[360px] flex-shrink-0 animate-fade-in relative z-10 transition-all duration-500">
                        <div className="sticky top-8">
                            <div className={`flex items-center justify-between mb-3 px-2 ${memoPosition === 'left' ? 'flex-row-reverse' : ''} relative ${guideStep === 3 ? 'z-[101] ring-4 ring-indigo-500/50 bg-white dark:bg-slate-800 p-2 rounded-2xl ring-offset-2' : ''}`}>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm"><Icon name="edit-3" size={18} /></span> 상담 메모
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => {
                                            if (confirm('진행 상황과 메모를 모두 초기화하시겠습니까?')) {
                                                setMemoData({ dbId: null, storeName: '', bizNum: '', contact: '', usedSolution: '', issue: '' });
                                                setHistory([]);
                                                setActiveStep('start');
                                                setSearchKeyword('');
                                                setIsMemoSearch(false);
                                            }
                                        }}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="메모 및 진행상황 초기화"
                                    >
                                        <Icon name="rotate-ccw" size={16} />
                                    </button>
                                    <button
                                        onClick={handleCopyMemo}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="메모 복사"
                                    >
                                        <Icon name="copy" size={16} />
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    <button
                                        onClick={() => setMemoPosition(memoPosition === 'left' ? 'right' : 'left')}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title={memoPosition === 'left' ? '우측으로 이동' : '좌측으로 이동'}
                                    >
                                        <Icon name={memoPosition === 'left' ? 'panel-right' : 'panel-left'} size={16} />
                                    </button>
                                    <button
                                        onClick={() => setMemoPosition('hidden')}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="메모 숨기기"
                                    >
                                        <Icon name="x" size={16} />
                                    </button>
                                </div>

                                {guideStep === 3 && (
                                    <div className={`absolute top-full ${memoPosition === 'left' ? 'left-0' : 'right-0'} mt-4 w-72 animate-fade-in-up bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-6 z-[102]`}>
                                        <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2"><Icon name="layout" size={18} /> 반응형 패널 이동</h3>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                            좌/우 이동 버튼으로 메모장을 편한 곳으로 옮길 수 있습니다. 화면을 넓게 써야할 땐 '숨기기' 도 가능합니다!
                                        </p>
                                        <div className="mt-5 flex justify-between">
                                            <button onClick={() => setGuideStep(2)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">이전</button>
                                            <button onClick={() => setGuideStep(4)} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 hover:bg-indigo-700">다음 가이드 ➔</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 transition-all ${guideStep === 1 || guideStep === 2 ? 'z-[101] ring-4 ring-indigo-500/50 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900' : ''}`}>

                                <div className="space-y-4 mb-6">
                                    <div className="relative" ref={storeSuggestionRef}>
                                        <input id="memo-storeName" autoComplete="off" value={memoData.storeName} onChange={e => {
                                            const val = e.target.value;
                                            if (memoData.dbId) {
                                                setMemoData({ ...memoData, storeName: val, dbId: null, bizNum: '', usedSolution: '' });
                                            } else {
                                                setMemoData({ ...memoData, storeName: val });
                                            }
                                            if (!isStoreSuggestionOpen) setIsStoreSuggestionOpen(true);
                                        }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setIsStoreSuggestionOpen(false); handleSearchStore(); } }} className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-blue-400 focus:bg-white dark:bg-slate-800 focus:outline-none" placeholder="매장명 검색 (예: 비버카페 강남점)" />

                                        {isStoreSuggestionOpen && storeSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                                {storeSuggestions.map(store => (
                                                    <button key={store.id} onClick={() => {
                                                        setMemoData(prev => ({
                                                            ...prev,
                                                            dbId: store.id,
                                                            bizNum: prev.bizNum || formatBizNum(store.biz_num),
                                                            storeName: store.store_name,
                                                            usedSolution: store.used_solution || prev.usedSolution,
                                                        }));
                                                        setIsStoreSuggestionOpen(false);
                                                    }} className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-center justify-between group">
                                                        <div className="flex flex-col gap-1 mt-0.5">
                                                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{store.store_name}</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {store.used_solution ? store.used_solution.split(',').map(s => s.trim()).filter(Boolean).map(sol => {
                                                                    const conf = PREDEFINED_SOLUTIONS.find(p => p.id === sol);
                                                                    const colorClass = conf ? getSolColorClasses(conf.color, true) : 'bg-slate-500 text-white border-slate-600 shadow-slate-500/30';
                                                                    return <span key={sol} className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${colorClass}`}>{sol}</span>;
                                                                }) : <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">솔루션 없음</span>}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded whitespace-nowrap ml-2 mt-auto mb-auto">{formatBizNum(store.biz_num)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input id="memo-bizNum" value={memoData.bizNum} onChange={e => {
                                            const val = formatBizNum(e.target.value);
                                            if (memoData.dbId) {
                                                setMemoData({ ...memoData, bizNum: val, dbId: null, storeName: '', usedSolution: '' });
                                            } else {
                                                setMemoData({ ...memoData, bizNum: val });
                                            }
                                        }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('memo-contact')?.focus(); } }} className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-blue-400 focus:bg-white dark:bg-slate-800 focus:outline-none" placeholder="사업자번호 (예: 123-45-67890)" maxLength={12} />
                                    </div>
                                    <div>
                                        <input id="memo-contact" value={memoData.contact} onChange={e => setMemoData({ ...memoData, contact: formatContact(e.target.value) })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchStore(); } }} className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-blue-400 focus:bg-white dark:bg-slate-800 focus:outline-none font-bold" placeholder="연락처 (예: 010-1234-5678)" maxLength={13} />
                                    </div>
                                    <button onClick={() => { setIsStoreSuggestionOpen(false); handleSearchStore(); }} className="w-full py-2 bg-transparent border border-indigo-200 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50">
                                        <Icon name="search" size={14} /> DB 매칭 검색
                                    </button>
                                    <div className="relative" ref={solutionDropdownRef}>
                                        <div className="flex items-center justify-between mb-1 gap-1">
                                            <div className={`flex gap-1.5 ${guideStep === 2 ? 'relative z-[103] ring-2 ring-indigo-500/50 bg-white ring-offset-2 rounded-lg' : ''}`}>
                                                <button
                                                    onClick={() => {
                                                        setUseManualMemoSearch(!useManualMemoSearch);
                                                        if (!useManualMemoSearch) setUseAutoMemoSearch(false);
                                                    }}
                                                    title="수동으로 검색"
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${useManualMemoSearch ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${useManualMemoSearch ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div> 수동검색
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUseAutoMemoSearch(!useAutoMemoSearch);
                                                        if (!useAutoMemoSearch) setUseManualMemoSearch(false);
                                                    }}
                                                    title="자동으로 추천 검색"
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${useAutoMemoSearch ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${useAutoMemoSearch ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div> 자동검색
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1 justify-end shrink-0">
                                                {memoData.dbId && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/40 rounded flex items-center shadow-sm whitespace-nowrap"><Icon name="check-circle" size={10} className="mr-0.5" />DB 연동</span>}
                                                <div className="relative" ref={storeSettingsRef}>
                                                    <button
                                                        onClick={() => setIsStoreSettingsExpanded(!isStoreSettingsExpanded)}
                                                        className="p-1 px-1.5 text-slate-400 hover:text-indigo-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm focus:outline-none flex items-center justify-center shrink-0"
                                                    >
                                                        <Icon name="settings" size={12} />
                                                    </button>

                                                    {isStoreSettingsExpanded && (
                                                        <div className="absolute right-0 top-full mt-1 flex flex-col gap-1 z-[60] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-xl w-32 animate-fade-in-up origin-top-right">
                                                            <button onClick={() => { handleSaveStore(); setIsStoreSettingsExpanded(false); }} className="w-full text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 px-2 py-1.5 rounded transition-colors focus:outline-none flex flex-row items-center justify-between">
                                                                <span>{memoData.dbId ? '정보 업데이트' : '새 매장 등록'}</span>
                                                                <Icon name="save" size={12} />
                                                            </button>
                                                            {memoData.dbId && (
                                                                <button onClick={() => { handleDeleteStore(); setIsStoreSettingsExpanded(false); }} className="w-full text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-2 py-1.5 rounded transition-colors focus:outline-none flex flex-row items-center justify-between">
                                                                    <span>매장 삭제</span>
                                                                    <Icon name="trash-2" size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setIsSolutionExpanded(!isSolutionExpanded)}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer min-h-[48px] flex flex-wrap gap-2 items-center transition-colors hover:border-blue-400 select-none"
                                        >
                                            {memoData.usedSolution.split(',').filter(Boolean).length === 0 ? (
                                                <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">이용 솔루션 선택...</span>
                                            ) : (
                                                memoData.usedSolution.split(',').map(s => s.trim()).filter(Boolean).map(sol => {
                                                    const conf = PREDEFINED_SOLUTIONS.find(s => s.id === sol);
                                                    const colorClass = conf ? getSolColorClasses(conf.color, true) : 'bg-slate-500 text-white border-slate-600 shadow-slate-500/30';
                                                    return (
                                                        <span key={sol} className={`px-2 py-0.5 text-xs font-bold rounded shadow-sm border ${colorClass} flex items-center gap-1`}>
                                                            {sol}
                                                            <button
                                                                type="button"
                                                                className="flex items-center justify-center opacity-80 hover:opacity-100 hover:text-white"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const newArr = memoData.usedSolution.split(',').map(s => s.trim()).filter(Boolean).filter(v => v !== sol);
                                                                    setMemoData({ ...memoData, usedSolution: newArr.join(', ') });
                                                                }}
                                                            >
                                                                <Icon name="x" size={12} className="cursor-pointer" />
                                                            </button>
                                                        </span>
                                                    );
                                                })
                                            )}
                                            <Icon name={isSolutionExpanded ? "chevron-up" : "chevron-down"} size={16} className="ml-auto text-slate-400" />
                                        </div>

                                        {isSolutionExpanded && (
                                            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl z-20 animate-fade-in-up">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {PREDEFINED_SOLUTIONS.map(sol => {
                                                        const currentSols = memoData.usedSolution.split(',').map(s => s.trim()).filter(Boolean);
                                                        const isActive = currentSols.includes(sol.id);
                                                        return (
                                                            <button
                                                                key={sol.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    let newArr = [...currentSols];
                                                                    if (isActive) newArr = newArr.filter(v => v !== sol.id);
                                                                    else newArr.push(sol.id);
                                                                    setMemoData({ ...memoData, usedSolution: newArr.join(', ') });
                                                                }}
                                                                className={`px-3 py-1.5 text-sm font-bold rounded-xl border-2 transition-all active:scale-95 ${getSolColorClasses(sol.color, isActive)}`}
                                                            >
                                                                {sol.id} {isActive && <Icon name="check" size={12} className="inline-block ml-1" />}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <div className="flex gap-2 relative">
                                                    <input
                                                        type="text"
                                                        className="flex-1 p-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-400 font-bold dark:text-slate-200"
                                                        placeholder="직접 입력 (입력 후 Enter)..."
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = e.target.value.trim();
                                                                const currentSols = memoData.usedSolution.split(',').map(s => s.trim()).filter(Boolean);
                                                                if (val && !currentSols.includes(val)) {
                                                                    setMemoData({ ...memoData, usedSolution: [...currentSols, val].join(', ') });
                                                                    e.target.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <textarea id="memo-issue" value={memoData.issue} onChange={e => setMemoData({ ...memoData, issue: e.target.value })} className={`w-full p-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl h-64 resize-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-blue-400 focus:bg-white dark:bg-slate-800 focus:outline-none custom-scrollbar relative ${guideStep === 1 ? 'z-[102]' : ''}`} placeholder="고객 문의내용을 상세히 메모하세요..."></textarea>

                                        {guideStep === 1 && (
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-6 w-72 animate-fade-in-left bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-6 z-[102] before:content-[''] before:absolute before:top-1/2 before:-right-3 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-l-indigo-500">
                                                <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2"><Icon name="edit-3" size={18} /> 똑똑한 자연어 인식!</h3>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    말을 길게 적어도 `~은`, `~가`, `안돼요` 등을 무시하고 <strong>유연하게 지침을 찾아냅니다.</strong> 결과가 완전히 사라지지 않고 연관성 점수로 찾아줍니다!
                                                </p>
                                                <div className="mt-5 flex justify-end">
                                                    <button onClick={() => setGuideStep(2)} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 hover:bg-indigo-700">다음 가이드 ➔</button>
                                                </div>
                                            </div>
                                        )}

                                        {guideStep === 2 && (
                                            <div className="absolute right-full top-0 mr-6 w-[280px] animate-fade-in-left bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-6 z-[104] before:content-[''] before:absolute before:top-4 before:-right-3 before:border-8 before:border-transparent before:border-l-indigo-500">
                                                <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2"><Icon name="toggle-right" size={18} /> 직관적인 검색 설정</h3>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    수동 검색으로 <strong>파란색 찾기 버튼</strong>을 쓸지, 타이핑 후 1초 뒤에 <strong>알아서 찾아주게 할지</strong> 밖에서 바로바로 켤 수 있습니다!
                                                </p>
                                                <div className="mt-5 flex justify-between">
                                                    <button onClick={() => setGuideStep(1)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">이전</button>
                                                    <button onClick={() => setGuideStep(3)} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 hover:bg-indigo-700">다음 ➔</button>
                                                </div>
                                            </div>
                                        )}

                                        {useManualMemoSearch && (
                                            <button onClick={() => {
                                                const v = memoData.issue.trim();
                                                if (v.length > 0) {
                                                    setIsMemoSearch(true);
                                                    setSearchKeyword(v);
                                                    setActiveStep('__search__');
                                                } else {
                                                    alert("고객 문의내용을 입력해주세요.");
                                                }
                                            }} className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md transition-all active:scale-95">
                                                <Icon name="search" size={16} /> 작성 내용으로 지침 찾기
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">선택한 분류 경로</label>
                                    <div className="flex flex-wrap gap-2">
                                        {history.filter(h => h.tag && h.tag !== "상황 파악 완료").map((h, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-1 shadow-sm"><Icon name="check" size={12} /> {h.tag}</span>
                                        ))}
                                        {history.filter(h => h.tag && h.tag !== "상황 파악 완료").length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">아직 선택된 분류가 없습니다.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-24 w-full border-t border-slate-200 dark:border-slate-700 pt-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-bold text-sm">
                        <Icon name="info" size={16} />
                        <span>장비별 하위 분류 및 모든 항목 편집 기능 장착 완료</span>
                    </div>
                    <div className="flex gap-4 relative">
                        {isMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 min-w-[240px] animate-fade-in z-50 origin-bottom-right">
                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1">관리자 도구</h4>
                                {supabase && (
                                    <button onClick={() => { loadFromDB(false); setIsMenuOpen(false); }} disabled={isLoadingDb} className="w-full px-4 py-3.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-400 hover:text-emerald-600 font-bold rounded-xl transition-all flex items-center gap-2.5 text-left active:scale-95 shadow-sm hover:shadow-md">
                                        <Icon name="cloud-download" size={16} /> DB 최신화
                                    </button>
                                )}
                                <button onClick={() => { setEditMode(!editMode); setIsMenuOpen(false); }} className={`w-full px-4 py-3.5 text-sm rounded-xl font-bold flex items-center gap-2.5 transition-all active:scale-95 shadow-sm hover:shadow-md ${editMode ? 'bg-indigo-600 text-white border-2 border-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-100 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600'}`}>
                                    <Icon name={editMode ? 'check' : 'edit-3'} size={16} /> {editMode ? '편집 모드 종료' : '화면 편집 켜기'}
                                </button>
                                <button onClick={() => { exportToExcel(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm shadow-sm hover:shadow-md active:scale-95">
                                    <Icon name="download" size={16} /> 엑셀 다운로드
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1"></div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-3 rounded-xl transition-all shadow-sm border-2 block ${isMenuOpen ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:text-slate-200 hover:border-slate-300'}`}
                            title="관리자 도구 열기"
                        >
                            <Icon name="settings" size={20} />
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
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-700/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative">
                        <button onClick={() => setIsSbModalOpen(false)} className="absolute top-6 right-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"><Icon name="x" size={24} /></button>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><Icon name="database" size={24} className="text-emerald-500" /> Database 연결 연결</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">Supabase URL과 Anon Key를 입력하면 모든 데이터가 데이터베이스에 저장되고 실시간으로 공유됩니다.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Project URL</label>
                                <input value={sbConfig.url} onChange={e => setSbConfig({ ...sbConfig, url: e.target.value })} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 font-mono text-sm focus:border-emerald-500 outline-none" placeholder="https://xxxx.supabase.co" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Project API Key (anon/public)</label>
                                <input value={sbConfig.key} onChange={e => setSbConfig({ ...sbConfig, key: e.target.value })} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 font-mono text-sm focus:border-emerald-500 outline-none" placeholder="eyJhbG..." />
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

            {/* Memo Restore Floating Button */}
            {memoPosition === 'hidden' && (
                <button
                    onClick={() => setMemoPosition('right')}
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3.5 bg-slate-900 dark:bg-slate-700 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all font-bold animate-fade-in group active:scale-95 hover:-translate-y-1"
                >
                    <span className="p-1 bg-white dark:bg-slate-800/20 rounded-full"><Icon name="edit-3" size={16} className="group-hover:rotate-12 transition-transform" /></span>
                    상담 메모 열기
                </button>
            )}

            {/* 다중 매장 선택 모달 */}
            {storeSelectModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 relative">
                        <button onClick={() => setStoreSelectModal({ isOpen: false, stores: [] })} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <Icon name="x" size={24} />
                        </button>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                            <Icon name="layers" size={24} className="text-indigo-500" /> 다중 매장 선택
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
                            입력하신 사업자번호({memoData.bizNum})로 등록된 여러 매장이 존재합니다.<br />이번에 문의가 들어온 정확한 매장을 선택해주세요.
                        </p>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                            {storeSelectModal.stores.map((store, idx) => (
                                <button
                                    key={store.id || idx}
                                    onClick={() => {
                                        setMemoData(prev => ({
                                            ...prev,
                                            dbId: store.id,
                                            storeName: store.store_name || prev.storeName,
                                            usedSolution: store.used_solution || prev.usedSolution,
                                        }));
                                        setStoreSelectModal({ isOpen: false, stores: [] });
                                        alert(`[${store.store_name}] 매장이 올바르게 선택되었습니다!`);
                                    }}
                                    className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-[0.98] group flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-black text-lg text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{store.store_name}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {store.used_solution ? store.used_solution.split(',').map(s => s.trim()).filter(Boolean).map(sol => {
                                                const conf = PREDEFINED_SOLUTIONS.find(p => p.id === sol);
                                                const colorClass = conf ? getSolColorClasses(conf.color, true) : 'bg-slate-500 text-white border-slate-600 shadow-slate-500/30';
                                                return <span key={sol} className={`px-2 py-0.5 text-xs font-bold rounded border ${colorClass}`}>{sol}</span>;
                                            }) : <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">솔루션 미기재</span>}
                                        </div>
                                    </div>
                                    <Icon name="chevron-right" size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);