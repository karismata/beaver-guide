// --- HANGUL SEARCH UTILS ---
const getChoseong = (str) => {
    const choseongList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) - 44032;
        if (code > -1 && code < 11172) result += choseongList[Math.floor(code / 588)];
        else result += str.charAt(i);
    }
    return result;
};

const matchSearch = (target, query) => {
    if (!query) return true;
    const normalizedTarget = target.toLowerCase().replace(/\s/g, "");
    const normalizedQuery = query.toLowerCase().replace(/\s/g, "");
    if (normalizedTarget.includes(normalizedQuery)) return true;
    const choseongTarget = getChoseong(normalizedTarget);
    return choseongTarget.includes(normalizedQuery);
};

// --- GLOBAL COMPONENTS ---
const Icon = ({ name, size = 24, className = "" }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current && window.lucide) {
            ref.current.innerHTML = `<i data-lucide="${name}" class="${className}" style="width: ${size}px; height: ${size}px;"></i>`;
            window.lucide.createIcons({ root: ref.current });
        }
    }, [name, size, className]);
    return <span ref={ref} className="inline-flex items-center justify-center flex-shrink-0" />;
};

const Step = ({ title, description, children, icon, color = "blue", onBack }) => (
    <div className="flex flex-col items-center animate-fade-in text-center relative w-full">
        {onBack && (
            <button onClick={onBack} className="absolute -top-12 left-0 flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 font-bold transition-colors group">
                <Icon name="arrow-left" size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>이전으로</span>
            </button>
        )}
        <div className={`w-20 h-20 rounded-full bg-${color}-100 flex items-center justify-center mb-6 border-4 border-white shadow-xl`}>
            <Icon name={icon} size={40} className={`text-${color}-600`} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-10 max-w-lg leading-relaxed whitespace-pre-line text-lg font-medium">{description}</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            {children}
        </div>
    </div>
);

const ChoiceButton = ({ label, onClick, sublabel, icon, color = "blue", editMode, onEdit, onDelete }) => {
    // แยก "한글명" 과 "(영문명)" 으로 분리
    const parts = label.match(/^(.*?)\s*(\(.*\))$/);

    return (
        <div className="relative group h-full">
            <button
                onClick={onClick}
                className={`w-full h-full group relative flex items-center p-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] hover:border-${color}-500 hover:shadow-2xl hover:shadow-${color}-100 transition-all duration-300 text-left overflow-hidden min-h-[120px]`}
            >
                <div className="flex-grow">
                    <div className={`font-bold text-slate-800 dark:text-slate-100 group-hover:text-${color}-600 mb-1 leading-tight`}>
                        {parts ? (
                            <>
                                <span className="text-xl block">{parts[1]}</span>
                                <span className="block text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">{parts[2]}</span>
                            </>
                        ) : (
                            <span className="text-xl block">{label}</span>
                        )}
                    </div>
                    {sublabel && <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:text-slate-400 dark:text-slate-500">{sublabel}</span>}
                </div>
                {icon && <Icon name={icon} size={28} className={`text-slate-300 dark:text-slate-600 group-hover:text-${color}-500 transition-colors ml-3 flex-shrink-0`} />}
                <div className={`absolute bottom-0 left-0 h-1.5 w-0 bg-${color}-500 transition-all duration-300 group-hover:w-full`}></div>
            </button>
            {editMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"><Icon name="pencil" size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-rose-600 rounded-full hover:bg-rose-100 transition-colors shadow-sm"><Icon name="trash-2" size={14} /></button>
                </div>
            )}
        </div>
    );
};

// --- URL LINKIFY COMPONENT ---
const Linkify = ({ text }) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            const href = part.startsWith('www.') ? `http://${part}` : part;
            return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700 break-all" onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        return part;
    });
};

const ResultCard = ({ stepKey, data, categories, newItem, setNewItem, addItem, removeItem, updateItem, moveOrCopyItem, onReset, onBack, defaultExpandedIdx }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedIdx, setExpandedIdx] = useState(defaultExpandedIdx !== undefined ? defaultExpandedIdx : null);

    useEffect(() => {
        if (defaultExpandedIdx !== undefined && defaultExpandedIdx !== null) {
            setExpandedIdx(defaultExpandedIdx);
        }
    }, [defaultExpandedIdx]);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editingText, setEditingText] = useState("");

    // 이동/복사 모달 상태
    const [actionModal, setActionModal] = useState({ isOpen: false, itemIndex: null, itemText: "" });
    const [selectedTarget, setSelectedTarget] = useState("");
    const [actionType, setActionType] = useState("copy"); // copy, move

    const openActionModal = (e, idx, text) => {
        e.stopPropagation();
        setActionModal({ isOpen: true, itemIndex: idx, itemText: text });
        setSelectedTarget("");
        setActionType("copy");
    };

    const handleActionSubmit = () => {
        if (!selectedTarget) {
            alert("이동/복사할 대상 분류를 선택해주세요.");
            return;
        }
        moveOrCopyItem(stepKey, selectedTarget, actionModal.itemIndex, actionType);
        setActionModal({ isOpen: false, itemIndex: null, itemText: "" });
    };

    const filteredList = useMemo(() => {
        return data.list.filter(item => matchSearch(item, searchTerm));
    }, [data.list, searchTerm]);

    const toggleAccordion = (idx) => {
        if (editingIdx !== null) return;
        setExpandedIdx(expandedIdx === idx ? null : idx);
    };

    const startEditing = (e, idx, text) => {
        e.stopPropagation();
        setEditingIdx(idx);
        setEditingText(text);
        setExpandedIdx(idx);
    };

    const saveEdit = (idx) => {
        updateItem(stepKey, idx, editingText);
        setEditingIdx(null);
    };

    const cancelEdit = () => {
        setEditingIdx(null);
        setEditingText("");
    };

    return (
        <div className={`w-full max-w-2xl p-8 rounded-[2.5rem] border-2 ${data.type === 'success' ? 'bg-emerald-50 border-emerald-100 shadow-emerald-50' : data.type === 'info' ? 'bg-indigo-50 border-indigo-100 shadow-indigo-50' : 'bg-rose-50 border-rose-100 shadow-rose-50'} shadow-2xl animate-fade-in`}>
            <div className="flex gap-2 mb-6">
                <button onClick={onBack} className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-600 rounded-xl hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 transition-all font-bold flex items-center shadow-sm active:scale-95">
                    <Icon name="arrow-left" size={16} className="mr-2" /> 이전으로
                </button>
                <button onClick={onReset} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-black transition-all font-bold flex items-center shadow-sm active:scale-95">
                    <Icon name="rotate-ccw" size={16} className="mr-2" /> 처음으로
                </button>
            </div>

            <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`p-4 rounded-2xl ${data.type === 'success' ? 'bg-emerald-500' : data.type === 'info' ? 'bg-indigo-500' : 'bg-rose-500'} text-white mr-4 shadow-lg shadow-current/20`}>
                            <Icon name={data.icon} size={32} />
                        </div>
                        <h3 className={`text-2xl font-black tracking-tight ${data.type === 'success' ? 'text-emerald-900' : data.type === 'info' ? 'text-indigo-900' : 'text-rose-900'}`}>{data.title}</h3>
                    </div>
                </div>

                <div className="relative">
                    <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="대응 지침 검색 (초성 입력 가능: ㅂㅂ)"
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800/80 backdrop-blur border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                    />
                </div>
            </div>

            <div className="space-y-3 mb-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {filteredList.length > 0 ? filteredList.map((item, idx) => {
                    const originalIdx = data.list.indexOf(item);
                    const isEditing = editingIdx === originalIdx;

                    return (
                        <div
                            key={originalIdx}
                            className={`group bg-white dark:bg-slate-800 rounded-2xl border transition-all ${expandedIdx === originalIdx ? 'border-blue-400 shadow-lg ring-1 ring-blue-100 accordion-open' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="w-full flex items-center p-4 text-left cursor-pointer" onClick={() => toggleAccordion(originalIdx)}>
                                <div className={`mr-3 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${data.type === 'success' ? 'bg-emerald-100 text-emerald-600' : data.type === 'info' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <Icon name={expandedIdx === originalIdx ? "minus" : "plus"} size={14} />
                                </div>
                                <span className="flex-grow text-slate-700 dark:text-slate-200 font-bold text-lg truncate">
                                    {item.split('\n')[0]}
                                </span>
                                <Icon name="chevron-down" size={18} className={`text-slate-300 dark:text-slate-600 transition-transform ${expandedIdx === originalIdx ? 'rotate-180' : ''}`} />
                            </div>

                            <div className="accordion-content px-4 sm:px-12">
                                <div className="border-t border-slate-50 pt-4">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-3 mb-4">
                                            <textarea
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border-2 border-blue-200 rounded-xl focus:outline-none font-medium text-slate-700 dark:text-slate-200 min-h-[120px]"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-lg font-bold hover:bg-slate-200 transition-all text-sm"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(originalIdx)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm"
                                                >
                                                    저장하기
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <p className="text-slate-600 dark:text-slate-300 dark:text-slate-600 font-medium whitespace-pre-line pb-2 leading-relaxed">
                                                <Linkify text={item} />
                                            </p>
                                            {data.image && originalIdx === 0 && (
                                                <div className="mt-2 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                                                    <img src={data.image} alt="첨부 이미지" className="w-full h-auto object-contain bg-slate-50 dark:bg-slate-900 dark:bg-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!isEditing && !data.isInfo && (
                                    <div className="flex justify-end gap-2 pb-4 flex-wrap mt-2">
                                        <button
                                            onClick={(e) => openActionModal(e, originalIdx, item)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all text-sm font-bold"
                                        >
                                            <Icon name="folder-input" size={14} /> 이동/복사
                                        </button>
                                        <button
                                            onClick={(e) => startEditing(e, originalIdx, item)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all text-sm font-bold"
                                        >
                                            <Icon name="pencil" size={14} /> 수정하기
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem(stepKey, originalIdx); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-sm font-bold"
                                        >
                                            <Icon name="trash-2" size={14} /> 삭제하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center">
                        <Icon name="search-x" size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-bold italic">검색 결과가 없습니다.</p>
                    </div>
                )}
            </div>

            {!data.isInfo && (
                <div className="relative mb-8">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(stepKey)}
                        placeholder="새로운 대응 지침 추가..."
                        className="w-full p-4 pr-16 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:text-slate-600 shadow-sm"
                    />
                    <button
                        onClick={() => addItem(stepKey)}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
                    >
                        <Icon name="plus" size={20} />
                    </button>
                </div>
            )}
            {/* 이동/복사 모달 */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900 dark:bg-slate-700/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in text-left">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <Icon name="copy" className="text-blue-500" /> 지침 이동 및 복사
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-600 mb-6 truncate bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-medium">
                            {actionModal.itemText.split('\n')[0]}
                        </p>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActionType('copy')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${actionType === 'copy' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300'}`}
                            >
                                <Icon name="copy" size={18} /> 복사하기
                            </button>
                            <button
                                onClick={() => setActionType('move')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${actionType === 'move' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300'}`}
                            >
                                <Icon name="folder-input" size={18} /> 이동하기
                            </button>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">대상 분류 선택</label>
                            <select
                                value={selectedTarget}
                                onChange={(e) => setSelectedTarget(e.target.value)}
                                className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                            >
                                <option value="" disabled>분류를 선택해주세요</option>
                                {categories.filter(c => c.id !== stepKey).map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setActionModal({ isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">취소</button>
                            <button
                                onClick={handleActionSubmit}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChoiceEditModal = ({ isOpen, onClose, choiceData, onSave, allTargets }) => {
    const [formData, setFormData] = useState(choiceData || { label: '', sublabel: '', target: '', color: 'blue', icon: 'chevron-right' });
    const [isNewTarget, setIsNewTarget] = useState(false);
    const [newTargetType, setNewTargetType] = useState('Step'); // 'Step' or 'Result'
    const [newTargetId, setNewTargetId] = useState('');
    const [newTargetTitle, setNewTargetTitle] = useState('');

    useEffect(() => {
        setFormData(choiceData || { label: '', sublabel: '', target: '', color: 'blue', icon: 'chevron-right' });
        setIsNewTarget(false);
        setNewTargetId('');
        setNewTargetTitle('');
    }, [choiceData, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-700/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Icon name="edit" className="text-blue-500" /> 선택지 변경/추가
                </h3>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">선택지 이름</label>
                        <input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium" placeholder="예: 카드 단말기 오류" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">보조 설명 (선택사항)</label>
                        <input value={formData.sublabel} onChange={(e) => setFormData({ ...formData, sublabel: e.target.value })} className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="예: 단말기 재부팅 안내 등" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">테마 & 아이콘 (Lucide)</label>
                        <div className="flex gap-2">
                            <select value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                                <option value="blue">Blue</option>
                                <option value="emerald">Emerald</option>
                                <option value="rose">Rose</option>
                                <option value="purple">Purple</option>
                                <option value="amber">Amber</option>
                                <option value="slate">Slate</option>
                            </select>
                            <input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="chevron-right" className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl" />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">버튼 클릭 시 이동할 화면</label>
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setIsNewTarget(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg border-2 ${!isNewTarget ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>기존 화면 연결</button>
                            <button onClick={() => setIsNewTarget(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg border-2 ${isNewTarget ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>새 화면 만들기</button>
                        </div>

                        {!isNewTarget ? (
                            <select value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:bg-slate-700 font-bold">
                                <option value="">목적지를 선택하세요</option>
                                {allTargets.map(t => <option key={t.id} value={t.id}>[{t.type === 'step' ? '선택형' : '지침형'}] {t.title}</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 mt-2">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                        <input type="radio" name="nt" checked={newTargetType === 'Step'} onChange={() => setNewTargetType('Step')} className="w-4 h-4 cursor-pointer" /> [선택형] 중간 단계
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                        <input type="radio" name="nt" checked={newTargetType === 'Result'} onChange={() => setNewTargetType('Result')} className="w-4 h-4 cursor-pointer" /> [지침형] 최종 결과
                                    </label>
                                </div>
                                <input value={newTargetId} onChange={e => setNewTargetId(e.target.value)} placeholder="영어 ID (예: my_new_step)" className="w-full p-3 border-2 border-white rounded-xl text-sm font-bold shadow-sm" />
                                <input value={newTargetTitle} onChange={e => setNewTargetTitle(e.target.value)} placeholder="새 화면의 제목을 입력하세요" className="w-full p-3 border-2 border-white rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-colors">취소</button>
                    <button onClick={() => {
                        let finalTarget = formData.target;
                        let createNew = null;
                        if (isNewTarget) {
                            if (!newTargetId.trim() || !newTargetTitle.trim()) { alert("새 화면의 ID와 제목을 모두 입력해주세요!"); return; }
                            finalTarget = newTargetId.trim();
                            createNew = { id: finalTarget, type: newTargetType, title: newTargetTitle.trim() };
                        }
                        if (!finalTarget) { alert("연결할 화면을 지정해주세요!"); return; }
                        onSave({ ...formData, target: finalTarget, id: formData.id || Date.now().toString() }, createNew);
                    }} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors shadow-blue-500/30">저장하기</button>
                </div>
            </div>
        </div>
    );
};
