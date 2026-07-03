import { useState, useMemo } from 'react';
import { studySections } from '../data/studyData';
import { BookOpen, Cpu, Shield, MapPin, Terminal, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Search, HelpCircle } from 'lucide-react';

export default function StudyTab() {
  const sections = useMemo(() => {
    const saved = localStorage.getItem('custom_study_sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return studySections;
  }, []);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({
    'pt-reescrita': true,
    'ti-cloud': true,
    'et-decreto': true,
    'al-emancipacao': true,
    'esp-devops': true,
    'enf-sus': true,
    'enf-etica': true,
    'jor-teoria': true,
    'jor-redacao': true
  });

  const iconMap: { [key: string]: any } = {
    BookOpen: BookOpen,
    Cpu: Cpu,
    Shield: Shield,
    MapPin: MapPin,
    Terminal: Terminal,
  };

  const colorMap: { [key: string]: { border: string, bg: string, text: string, hover: string, activeBg: string } } = {
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-50',
      activeBg: 'bg-emerald-600 text-white'
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-50',
      activeBg: 'bg-blue-600 text-white'
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-50',
      activeBg: 'bg-amber-500 text-white'
    },
    rose: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      hover: 'hover:bg-rose-50',
      activeBg: 'bg-rose-600 text-white'
    },
    slate: {
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      hover: 'hover:bg-slate-50',
      activeBg: 'bg-slate-700 text-white'
    }
  };

  const activeSection = useMemo(() => {
    const currentId = activeSectionId || (sections[0] ? sections[0].id : '');
    return sections.find(s => s.id === currentId) || sections[0];
  }, [activeSectionId, sections]);

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Filter study cards by search term
  const filteredCards = useMemo(() => {
    if (!activeSection) return [];
    if (!searchTerm.trim()) return activeSection.cards;
    const lowerSearch = searchTerm.toLowerCase();
    return activeSection.cards.filter(card => 
      card.title.toLowerCase().includes(lowerSearch) || 
      card.content.toLowerCase().includes(lowerSearch) ||
      card.keyTakeaways.some(t => t.toLowerCase().includes(lowerSearch))
    );
  }, [activeSection, searchTerm]);

  if (sections.length === 0 || !activeSection) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
        <p className="text-slate-500 text-sm">Nenhum assunto disponível no cronograma ativo atual. Crie um novo plano na página inicial!</p>
      </div>
    );
  }

  return (
    <div id="study-tab-container" className="space-y-6">
      {/* Subject Selector and Search Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-slate lg:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => {
            const IconComponent = iconMap[section.icon] || HelpCircle;
            const colors = colorMap[section.color] || colorMap.slate;
            const isActive = section.id === activeSection.id;

            return (
              <button
                key={section.id}
                id={`btn-tab-${section.id}`}
                onClick={() => {
                  setActiveSectionId(section.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? colors.activeBg + ' shadow-sm'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{section.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 font-bold">
                  {section.weight}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="study-search-input"
            type="text"
            placeholder="Pesquisar nos resumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* active section overview & Pareto Explanation */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-700">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-amber-950 rounded-full flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Princípio de Pareto Recursivo
            </span>
            <span className="px-2.5 py-1 text-xs font-bold bg-white/10 rounded-full">
              Dificuldade: {activeSection.difficulty}
            </span>
            <span className="px-2.5 py-1 text-xs font-bold bg-white/10 rounded-full">
              Peso na Prova: {activeSection.weight}
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white">{activeSection.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{activeSection.paretoJustification}</p>
        </div>
      </div>

      {/* Study Notes List */}
      <div className="space-y-4">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">Nenhum resumo encontrado para "{searchTerm}".</p>
          </div>
        ) : (
          filteredCards.map(card => {
            const isExpanded = !!expandedCards[card.id];
            const colors = colorMap[activeSection.color];

            return (
              <div 
                key={card.id} 
                id={`card-${card.id}`}
                className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all"
              >
                {/* Card Header (Clickable) */}
                <div 
                  onClick={() => toggleCard(card.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${activeSection.color === 'emerald' ? 'bg-emerald-500' : activeSection.color === 'blue' ? 'bg-blue-500' : activeSection.color === 'amber' ? 'bg-amber-500' : activeSection.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'}`}></div>
                    <h3 className="font-bold text-sm lg:text-base text-slate-800">{card.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {card.paretoRatio}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Card Expandable Body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-white space-y-4">
                    {/* Rich HTML Content */}
                    <div 
                      className="text-sm text-slate-600 leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: card.content }}
                    />

                    {/* Key Takeaways */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Resumo de Ouro (Decoreba Necessária)</span>
                      </div>
                      <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
                        {card.keyTakeaways.map((takeaway, index) => (
                          <li key={index}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
