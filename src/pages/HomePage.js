import React, { useState, useMemo } from 'react';
import ChampionCard from '../components/ChampionCard';
import ChampionModal from '../components/ChampionModal';
import { useSession } from '../contexts/SessionContext';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, getSummonerInfo } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const summonerInfo = getSummonerInfo();

  // Mock champion data - in real implementation, this would come from API
  const mockChampions = [
    {
      id: 'Ahri',
      name: 'Ahri',
      title: 'the Nine-Tailed Fox',
      tags: ['Mage', 'Assassin'],
      info: { attack: 3, defense: 4, magic: 8, difficulty: 5 },
      image: { full: 'Ahri.png' },
      skills: [
        { key: 'P', name: 'Essence Theft', description: '적 챔피언에게 스킬을 적중시키면 체력을 회복합니다.' },
        { key: 'Q', name: 'Orb of Deception', description: '구슬을 던져 적들에게 마법 피해를 입힙니다.' },
        { key: 'W', name: 'Fox-Fire', description: '여우불을 소환하여 주변 적들을 공격합니다.' },
        { key: 'E', name: 'Charm', description: '적을 매혹시켜 자신 쪽으로 끌어당깁니다.' },
        { key: 'R', name: 'Spirit Rush', description: '순간이동하며 적들에게 피해를 입힙니다.' }
      ],
      lore: '아이오니아의 광활한 숲에서 태어난 아리는 자신의 마법적 본질과 인간 세계 사이에서 균형을 찾으려 노력하는 구미호입니다.'
    },
    {
      id: 'Aatrox',
      name: 'Aatrox',
      title: 'the Darkin Blade',
      tags: ['Fighter', 'Tank'],
      info: { attack: 8, defense: 4, magic: 3, difficulty: 4 },
      image: { full: 'Aatrox.png' },
      skills: [
        { key: 'P', name: 'Deathbringer Stance', description: '주기적으로 다음 기본 공격이 추가 피해를 입히고 체력을 회복합니다.' },
        { key: 'Q', name: 'The Darkin Blade', description: '검을 휘둘러 적들에게 물리 피해를 입힙니다.' },
        { key: 'W', name: 'Infernal Chains', description: '사슬을 던져 적을 끌어당기고 둔화시킵니다.' },
        { key: 'E', name: 'Umbral Dash', description: '짧은 거리를 돌진하며 공격력이 증가합니다.' },
        { key: 'R', name: 'World Ender', description: '악마의 형태로 변신하여 능력치가 대폭 증가합니다.' }
      ],
      lore: '한때 슈리마의 위대한 전사였던 아트록스는 이제 자신의 검에 갇힌 다르킨으로, 복수와 파괴만을 추구합니다.'
    },
    {
      id: 'Akali',
      name: 'Akali',
      title: 'the Rogue Assassin',
      tags: ['Assassin'],
      info: { attack: 5, defense: 3, magic: 8, difficulty: 7 },
      image: { full: 'Akali.png' },
      skills: [
        { key: 'P', name: 'Assassin\'s Mark', description: '스킬로 적을 맞히면 표식이 생기고, 표식을 공격하면 추가 피해를 입힙니다.' },
        { key: 'Q', name: 'Five Point Strike', description: '쿠나이를 던져 부채꼴 범위의 적들에게 피해를 입힙니다.' },
        { key: 'W', name: 'Twilight Shroud', description: '연막을 생성하여 은신하고 이동 속도가 증가합니다.' },
        { key: 'E', name: 'Shuriken Flip', description: '수리검을 던지고 재사용하면 적에게 돌진합니다.' },
        { key: 'R', name: 'Perfect Execution', description: '적에게 돌진하여 강력한 피해를 입힙니다.' }
      ],
      lore: '킨코우 결사를 떠난 아칼리는 이제 홀로 아이오니아의 적들과 맞서 싸우는 자유로운 암살자입니다.'
    },
    {
      id: 'Alistar',
      name: 'Alistar',
      title: 'the Minotaur',
      tags: ['Tank', 'Support'],
      info: { attack: 6, defense: 9, magic: 5, difficulty: 7 },
      image: { full: 'Alistar.png' },
      skills: [
        { key: 'P', name: 'Triumphant Roar', description: '주변 적이 죽으면 자신과 주변 아군의 체력을 회복합니다.' },
        { key: 'Q', name: 'Pulverize', description: '땅을 내려쳐 주변 적들을 공중으로 띄웁니다.' },
        { key: 'W', name: 'Headbutt', description: '적을 들이받아 뒤로 밀어내고 기절시킵니다.' },
        { key: 'E', name: 'Trample', description: '주변 적들을 짓밟아 지속 피해를 입힙니다.' },
        { key: 'R', name: 'Unbreakable Will', description: '모든 군중 제어 효과를 제거하고 피해를 크게 감소시킵니다.' }
      ],
      lore: '한때 노예였던 미노타우로스 알리스타는 이제 자유를 위해 싸우며 약자들을 보호하는 전사가 되었습니다.'
    },
    {
      id: 'Amumu',
      name: 'Ammu',
      title: 'the Sad Mummy',
      tags: ['Tank', 'Mage'],
      info: { attack: 2, defense: 6, magic: 8, difficulty: 3 },
      image: { full: 'Ammu.png' },
      skills: [
        { key: 'P', name: 'Cursed Touch', description: '기본 공격과 스킬이 적에게 저주를 걸어 받는 마법 피해를 증가시킵니다.' },
        { key: 'Q', name: 'Bandage Toss', description: '붕대를 던져 적에게 돌진하고 기절시킵니다.' },
        { key: 'W', name: 'Despair', description: '주변 적들에게 지속적으로 마법 피해를 입힙니다.' },
        { key: 'E', name: 'Tantrum', description: '분노를 폭발시켜 주변 적들에게 피해를 입힙니다.' },
        { key: 'R', name: 'Curse of the Sad Mummy', description: '붕대로 주변 적들을 감싸 기절시키고 피해를 입힙니다.' }
      ],
      lore: '고대 슈리마의 저주받은 미라 아무무는 영원한 외로움 속에서 친구를 찾아 헤매고 있습니다.'
    },
    {
      id: 'Yasuo',
      name: 'Yasuo',
      title: 'the Unforgiven',
      tags: ['Fighter', 'Assassin'],
      info: { attack: 8, defense: 4, magic: 4, difficulty: 10 },
      image: { full: 'Yasuo.png' },
      skills: [
        { key: 'P', name: 'Way of the Wanderer', description: '이동하면 보호막이 생성되고, 치명타 확률이 2배가 됩니다.' },
        { key: 'Q', name: 'Steel Tempest', description: '검으로 찔러 적들에게 피해를 입히고, 3번째 사용 시 회오리바람을 생성합니다.' },
        { key: 'W', name: 'Wind Wall', description: '바람 장벽을 생성하여 투사체를 차단합니다.' },
        { key: 'E', name: 'Sweeping Blade', description: '적을 관통하며 돌진하여 피해를 입힙니다.' },
        { key: 'R', name: 'Last Breath', description: '공중에 뜬 적들에게 순간이동하여 강력한 피해를 입힙니다.' }
      ],
      lore: '아이오니아의 검술 대가 야스오는 스승을 죽인 누명을 쓰고 진실을 찾기 위해 방랑하는 검사입니다.'
    }
  ];

  const roles = [
    { value: 'all', label: '전체' },
    { value: 'Assassin', label: '암살자' },
    { value: 'Fighter', label: '전사' },
    { value: 'Mage', label: '마법사' },
    { value: 'Marksman', label: '원거리딜러' },
    { value: 'Support', label: '서포터' },
    { value: 'Tank', label: '탱커' }
  ];

  const filteredChampions = useMemo(() => {
    return mockChampions.filter(champion => {
      const matchesSearch = champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           champion.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || champion.tags.includes(selectedRole);
      return matchesSearch && matchesRole;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedRole]);

  const handleChampionClick = (champion) => {
    setSelectedChampion(champion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChampion(null);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>리그오브레전드 전적 분석</h2>
        <p>챔피언 정보를 확인하고, 소환사 전적을 분석해보세요.</p>
        
        {isAuthenticated && summonerInfo && (
          <div className="welcome-message">
            <p>안녕하세요, <strong>{summonerInfo.riotId}</strong>님! 
               <a href="/summoner"> 전적 페이지</a>에서 최신 데이터를 확인하거나 
               <a href="/analysis"> 분석 페이지</a>에서 상세 분석을 받아보세요.</p>
          </div>
        )}
      </div>
      
      <div className="features-grid">
        <div className="feature-card">
          <h3>챔피언 정보</h3>
          <p>모든 챔피언의 스탯, 스킬, 빌드 정보를 확인하세요.</p>
        </div>
        
        <div className="feature-card">
          <h3>전적 분석</h3>
          <p>소환사명을 입력하여 최근 게임 전적을 분석받으세요.</p>
        </div>
        
        <div className="feature-card">
          <h3>AI 챗봇</h3>
          <p>우측 하단의 챗봇으로 언제든 AI와 대화하며 개인화된 플레이 조언을 받아보세요.</p>
        </div>
      </div>
      
      <div className="champions-section">
        <h3>챔피언 목록</h3>
        
        <div className="champions-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="챔피언 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="champion-search"
            />
          </div>
          
          <div className="role-filter">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-select"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="champions-grid">
          {filteredChampions.map(champion => (
            <ChampionCard
              key={champion.id}
              champion={champion}
              onClick={handleChampionClick}
            />
          ))}
        </div>

        {filteredChampions.length === 0 && (
          <div className="no-champions">
            <p>검색 조건에 맞는 챔피언이 없습니다.</p>
          </div>
        )}
      </div>

      <ChampionModal
        champion={selectedChampion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomePage;