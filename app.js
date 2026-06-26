// Solo Leveling Personal Development System
// Core Application Logic

class SoundSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(freq, type, duration, vol) {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playLevelUp() {
        this.playTone(440, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(554, 'square', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(659, 'square', 0.1, 0.1), 200);
        setTimeout(() => this.playTone(880, 'square', 0.4, 0.1), 300);
    }

    playNotification() {
        this.playTone(880, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1760, 'sine', 0.2, 0.05), 100);
    }

    playReward() {
        this.playTone(523.25, 'triangle', 0.1, 0.1);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.3, 0.1), 200);
    }
}

class VFXSystem {
    constructor() {
        this.canvas = document.getElementById('vfxCanvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    fireConfetti(x, y) {
        if(!this.canvas) return;
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                size: Math.random() * 5 + 2,
                color: ['#00f0ff', '#b026ff', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)],
                life: 1.0
            });
        }
    }

    animate() {
        if(!this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= 0.01;
            
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        this.ctx.globalAlpha = 1.0;
        requestAnimationFrame(() => this.animate());
    }
}
class SoloLevelingSystem {
    constructor() {
        this.soundSystem = new SoundSystem();
        this.vfxSystem = new VFXSystem();
        this.character = this.loadCharacter();
        this.achievements = this.loadAchievements();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.checkAchievements();
        if (!this.character.hasSeenTutorial) {
            this.startTutorial();
        }
    }

    // Data Storage
    loadCharacter() {
        const saved = localStorage.getItem('soloLevelingCharacter');
        if (saved) {
            const character = JSON.parse(saved);
            // Birthday update
            if (character.name === 'Hunter') {
                character.name = 'Ojas';
            }
            // Ensure backward compatibility
            if (!character.unlockedItems) character.unlockedItems = [];
            if (!character.unlockedQuotes) character.unlockedQuotes = [];
            if (character.hasSeenTutorial === undefined) character.hasSeenTutorial = false;
            if (!character.dailyQuests) character.dailyQuests = this.getDefaultQuests(character.rank);
            
            // Check daily reset
            const today = new Date().toDateString();
            if (character.lastLoginDate !== today) {
                character.dailyQuests = this.getDefaultQuests(character.rank);
                character.lastLoginDate = today;
            } else {
                // Ensure quests match the current rank
                const expectedQuests = this.getDefaultQuests(character.rank);
                character.dailyQuests = expectedQuests.map((eq) => {
                    const currentQ = character.dailyQuests.find(q => q.id === eq.id);
                    return {
                        ...eq,
                        completed: currentQ ? currentQ.completed : false
                    };
                });
            }
            
            return character;
        }
        return this.createNewCharacter();
    }

    getDefaultQuests(rank = 'E-Rank') {
        const quests = {
            'E-Rank': [
                { id: 'pushups', name: '10 Push-ups', completed: false },
                { id: 'situps', name: '10 Sit-ups', completed: false },
                { id: 'run', name: '1km Run', completed: false },
                { id: 'math', name: 'Complete 1 Basic Math Quiz', completed: false }
            ],
            'D-Rank': [
                { id: 'pushups', name: '50 Push-ups', completed: false },
                { id: 'situps', name: '50 Sit-ups', completed: false },
                { id: 'run', name: '5km Run', completed: false },
                { id: 'math', name: 'Complete 2 Easy Math Quizzes', completed: false }
            ],
            'C-Rank': [
                { id: 'pushups', name: '100 Push-ups', completed: false },
                { id: 'situps', name: '100 Sit-ups', completed: false },
                { id: 'run', name: '10km Run', completed: false },
                { id: 'math', name: 'Complete 3 Intermediate Math Quizzes', completed: false }
            ],
            'B-Rank': [
                { id: 'pushups', name: '150 Push-ups', completed: false },
                { id: 'situps', name: '150 Sit-ups', completed: false },
                { id: 'run', name: '15km Run', completed: false },
                { id: 'math', name: 'Complete 5 Hard Math Quizzes', completed: false }
            ],
            'A-Rank': [
                { id: 'pushups', name: '200 Push-ups', completed: false },
                { id: 'situps', name: '200 Sit-ups', completed: false },
                { id: 'run', name: '20km Run', completed: false },
                { id: 'math', name: 'Complete 10 Advanced Math Quizzes', completed: false }
            ],
            'S-Rank': [
                { id: 'pushups', name: '300 Push-ups', completed: false },
                { id: 'situps', name: '300 Sit-ups', completed: false },
                { id: 'run', name: '30km Run', completed: false },
                { id: 'math', name: 'Complete 15 Expert Math Quizzes', completed: false }
            ]
        };
        return quests[rank] || quests['E-Rank'];
    }

    createNewCharacter() {
        return {
            name: 'Ojas',
            level: 1,
            experience: 0,
            rank: 'E-Rank',
            stats: {
                strength: 10,
                endurance: 10,
                intelligence: 10,
                focus: 10,
                skillPoints: 0
            },
            activities: [],
            achievements: [],
            unlockedItems: [],
            unlockedQuotes: [],
            dailyQuests: this.getDefaultQuests(),
            lastLoginDate: new Date().toDateString(),
            createdAt: new Date().toISOString(),
            lastActivity: null,
            hasSeenTutorial: false
        };
    }

    saveCharacter() {
        localStorage.setItem('soloLevelingCharacter', JSON.stringify(this.character));
    }

    loadAchievements() {
        return [
            {
                id: 'first_study',
                name: 'First Steps',
                description: 'Complete your first study session',
                icon: '📚',
                unlocked: false,
                date: null,
                requirement: (char) => char.activities.filter(a => a.type === 'study').length >= 1
            },
            {
                id: 'first_exercise',
                name: 'Physical Awakening',
                description: 'Complete your first workout',
                icon: '💪',
                unlocked: false,
                date: null,
                requirement: (char) => char.activities.filter(a => a.type === 'exercise').length >= 1
            },
            {
                id: 'study_10h',
                name: 'Scholar',
                description: 'Complete 10 hours of studying',
                icon: '🎓',
                unlocked: false,
                date: null,
                requirement: (char) => {
                    const studyTime = char.activities
                        .filter(a => a.type === 'study')
                        .reduce((sum, a) => sum + a.duration, 0);
                    return studyTime >= 600; // 10 hours in minutes
                }
            },
            {
                id: 'exercise_10h',
                name: 'Warrior',
                description: 'Complete 10 hours of exercise',
                icon: '⚔️',
                unlocked: false,
                date: null,
                requirement: (char) => {
                    const exerciseTime = char.activities
                        .filter(a => a.type === 'exercise')
                        .reduce((sum, a) => sum + a.duration, 0);
                    return exerciseTime >= 600;
                }
            },
            {
                id: 'level_5',
                name: 'Rising Star',
                description: 'Reach Level 5',
                icon: '⭐',
                unlocked: false,
                date: null,
                requirement: (char) => char.level >= 5
            },
            {
                id: 'level_10',
                name: 'Elite',
                description: 'Reach Level 10',
                icon: '🌟',
                unlocked: false,
                date: null,
                requirement: (char) => char.level >= 10
            },
            {
                id: 'level_20',
                name: 'Master',
                description: 'Reach Level 20',
                icon: '👑',
                unlocked: false,
                date: null,
                requirement: (char) => char.level >= 20
            },
            {
                id: 'streak_7',
                name: 'Consistency',
                description: 'Maintain a 7-day activity streak',
                icon: '🔥',
                unlocked: false,
                date: null,
                requirement: (char) => {
                    if (char.activities.length < 7) return false;
                    const sorted = [...char.activities].sort((a, b) => 
                        new Date(b.date) - new Date(a.date)
                    );
                    let streak = 1;
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const date1 = new Date(sorted[i].date);
                        const date2 = new Date(sorted[i + 1].date);
                        const diffDays = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
                        if (diffDays === 1) {
                            streak++;
                        } else if (diffDays > 1) {
                            break;
                        }
                    }
                    return streak >= 7;
                }
            },
            {
                id: 'stat_50',
                name: 'Peak Performance',
                description: 'Reach 50 in any stat',
                icon: '💎',
                unlocked: false,
                date: null,
                requirement: (char) => {
                    const stats = char.stats;
                    return stats.strength >= 50 || stats.endurance >= 50 || 
                           stats.intelligence >= 50 || stats.focus >= 50;
                }
            },
            {
                id: 'total_100h',
                name: 'Dedication',
                description: 'Complete 100 total hours of activities',
                icon: '🏆',
                unlocked: false,
                date: null,
                requirement: (char) => {
                    const totalTime = char.activities.reduce((sum, a) => sum + a.duration, 0);
                    return totalTime >= 6000; // 100 hours in minutes
                }
            }
        ];
    }

    // XP and Level Calculation
    getXPForLevel(level) {
        // Exponential scaling: base * (multiplier ^ level)
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    calculateXP(duration, difficulty, activityType) {
        // Base XP per minute
        let baseXP = 1;
        
        // Activity type multipliers
        const typeMultipliers = {
            'study': 1.2,
            'exercise': 1.0,
            'practice': 1.3,
            'work': 1.1
        };
        
        baseXP *= typeMultipliers[activityType] || 1.0;
        
        // Difficulty multiplier
        baseXP *= parseFloat(difficulty);
        
        // Duration (in minutes)
        let xp = Math.floor(baseXP * duration);
        
        // Consistency bonus
        const consistencyBonus = this.getConsistencyBonus();
        xp = Math.floor(xp * (1 + consistencyBonus));
        
        // XP Multiplier feature (if unlocked)
        if (this.character.unlockedItems.includes('feature_xp_boost')) {
            xp = Math.floor(xp * 1.2);
        }
        
        return xp;
    }

    getConsistencyBonus() {
        if (this.character.activities.length === 0) return 0;
        
        const last7Days = this.character.activities.filter(a => {
            const activityDate = new Date(a.date);
            const daysAgo = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
        });
        
        let bonus = 0;
        if (last7Days.length >= 7) bonus = 0.2; // 20% bonus for 7+ activities in last week
        else if (last7Days.length >= 5) bonus = 0.1; // 10% bonus for 5+ activities
        
        // Consistency Master feature (if unlocked)
        if (this.character.unlockedItems.includes('feature_consistency_plus')) {
            bonus += 0.1; // Additional 10% bonus
        }
        
        return bonus;
    }

    addExperience(xp) {
        this.character.experience += xp;
        let leveledUp = false;
        
        while (this.character.experience >= this.getXPForLevel(this.character.level)) {
            this.character.experience -= this.getXPForLevel(this.character.level);
            this.character.level++;
            leveledUp = true;
            
            // Level up rewards
            this.character.stats.skillPoints += 2;
            
            // Update rank
            this.updateRank();
        }
        
        return leveledUp;
    }

    updateRank() {
        const level = this.character.level;
        if (level >= 50) this.character.rank = 'S-Rank';
        else if (level >= 30) this.character.rank = 'A-Rank';
        else if (level >= 20) this.character.rank = 'B-Rank';
        else if (level >= 10) this.character.rank = 'C-Rank';
        else if (level >= 5) this.character.rank = 'D-Rank';
        else this.character.rank = 'E-Rank';
    }

    // Stat Updates
    updateStats(activityType, duration, difficulty) {
        const statGain = Math.floor((duration / 30) * parseFloat(difficulty)); // Base gain per 30 minutes
        
        switch (activityType) {
            case 'study':
                this.character.stats.intelligence += statGain;
                this.character.stats.focus += Math.floor(statGain * 0.5);
                break;
            case 'exercise':
                this.character.stats.strength += statGain;
                this.character.stats.endurance += statGain;
                break;
            case 'practice':
                this.character.stats.intelligence += Math.floor(statGain * 0.7);
                this.character.stats.focus += statGain;
                break;
            case 'work':
                this.character.stats.focus += statGain;
                this.character.stats.intelligence += Math.floor(statGain * 0.3);
                break;
        }
    }

    getStatMax(statValue) {
        // Calculate max based on level and base stat
        return Math.max(100, this.character.level * 10);
    }

    // Activity Logging
    logActivity(type, category, duration, difficulty) {
        const xp = this.calculateXP(duration, difficulty, type);
        const leveledUp = this.addExperience(xp);
        this.updateStats(type, duration, difficulty);
        
        const activity = {
            id: Date.now(),
            type: type,
            category: category,
            duration: parseInt(duration),
            difficulty: parseFloat(difficulty),
            xp: xp,
            date: new Date().toISOString(),
            statsAffected: this.getStatsAffected(type)
        };
        
        this.character.activities.push(activity);
        this.character.lastActivity = new Date().toISOString();
        this.saveCharacter();
        
        // Check for new achievements
        const newAchievements = this.checkAchievements();
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
        
        if (newAchievements.length > 0) {
            newAchievements.forEach(ach => this.showAchievement(ach));
        }
        
        return activity;
    }

    getStatsAffected(type) {
        const affected = {
            'study': ['intelligence', 'focus'],
            'exercise': ['strength', 'endurance'],
            'practice': ['intelligence', 'focus'],
            'work': ['focus', 'intelligence']
        };
        return affected[type] || [];
    }

    // Achievement System
    checkAchievements() {
        const newlyUnlocked = [];
        
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.requirement(this.character)) {
                achievement.unlocked = true;
                achievement.date = new Date().toISOString();
                this.character.achievements.push(achievement.id);
                newlyUnlocked.push(achievement);
                
                // Achievement rewards
                this.character.experience += 50; // Bonus XP
                this.addExperience(0); // Check for level up from bonus XP
            }
        });
        
        if (newlyUnlocked.length > 0) {
            this.saveCharacter();
        }
        
        return newlyUnlocked;
    }

    // UI Updates
    updateUI() {
        this.updateStatusPanel();
        this.updateHistory();
        this.updateAnalytics();
        this.updateAchievements();
        this.updateShop();
        this.updateQuests();
    }

    updateStatusPanel() {
        document.getElementById('characterName').textContent = this.character.name;
        document.getElementById('rankBadge').textContent = this.character.rank;
        document.getElementById('rankImage').src = 'images/' + this.character.rank + '.png';
        document.getElementById('levelValue').textContent = this.character.level;
        
        const xpNeeded = this.getXPForLevel(this.character.level);
        const xpPercent = (this.character.experience / xpNeeded) * 100;
        document.getElementById('xpText').textContent = `${this.character.experience} / ${xpNeeded} XP`;
        document.getElementById('xpBarFill').style.width = `${xpPercent}%`;
        
        // Update stats
        const stats = this.character.stats;
        document.getElementById('statStrength').textContent = stats.strength;
        document.getElementById('statEndurance').textContent = stats.endurance;
        document.getElementById('statIntelligence').textContent = stats.intelligence;
        document.getElementById('statFocus').textContent = stats.focus;
        document.getElementById('statSkillPoints').textContent = stats.skillPoints;
        
        // Update stat bars
        const maxStat = this.getStatMax(100);
        document.getElementById('statStrengthBar').style.width = `${(stats.strength / maxStat) * 100}%`;
        document.getElementById('statEnduranceBar').style.width = `${(stats.endurance / maxStat) * 100}%`;
        document.getElementById('statIntelligenceBar').style.width = `${(stats.intelligence / maxStat) * 100}%`;
        document.getElementById('statFocusBar').style.width = `${(stats.focus / maxStat) * 100}%`;
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        const filter = document.getElementById('historyFilter').value;
        
        let activities = [...this.character.activities];
        if (filter !== 'all') {
            activities = activities.filter(a => a.type === filter);
        }
        
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (activities.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No activities logged yet. Start your journey!</p>';
            return;
        }
        
        historyList.innerHTML = activities.map(activity => {
            const date = new Date(activity.date);
            const typeLabels = {
                'study': '📚 Study',
                'exercise': '💪 Exercise',
                'practice': '🎯 Practice',
                'work': '💼 Work'
            };
            
            return `
                <div class="history-item">
                    <div class="history-item-info">
                        <div class="history-item-type">${typeLabels[activity.type] || activity.type}</div>
                        <div class="history-item-name">${activity.category}</div>
                        <div class="history-item-details">
                            ${this.formatDuration(activity.duration)} • 
                            ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
                            Difficulty: ${activity.difficulty}x
                        </div>
                    </div>
                    <div class="history-item-xp">+${activity.xp} XP</div>
                </div>
            `;
        }).join('');
    }

    updateAnalytics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todayActivities = this.character.activities.filter(a => new Date(a.date) >= today);
        const weekActivities = this.character.activities.filter(a => new Date(a.date) >= weekAgo);
        const monthActivities = this.character.activities.filter(a => new Date(a.date) >= monthAgo);
        
        const timeToday = todayActivities.reduce((sum, a) => sum + a.duration, 0);
        const timeWeek = weekActivities.reduce((sum, a) => sum + a.duration, 0);
        const timeMonth = monthActivities.reduce((sum, a) => sum + a.duration, 0);
        
        document.getElementById('timeToday').textContent = this.formatDuration(timeToday);
        document.getElementById('timeWeek').textContent = this.formatDuration(timeWeek);
        document.getElementById('timeMonth').textContent = this.formatDuration(timeMonth);
        
        // Stat growth
        const statGrowth = document.getElementById('statGrowth');
        const stats = this.character.stats;
        statGrowth.innerHTML = `
            <div class="stat-growth-item">
                <span>Strength</span>
                <span>${stats.strength}</span>
            </div>
            <div class="stat-growth-item">
                <span>Endurance</span>
                <span>${stats.endurance}</span>
            </div>
            <div class="stat-growth-item">
                <span>Intelligence</span>
                <span>${stats.intelligence}</span>
            </div>
            <div class="stat-growth-item">
                <span>Focus</span>
                <span>${stats.focus}</span>
            </div>
        `;
        
        // Strongest areas
        const typeStats = {};
        this.character.activities.forEach(a => {
            typeStats[a.type] = (typeStats[a.type] || 0) + a.duration;
        });
        
        const sortedTypes = Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const strongestAreas = document.getElementById('strongestAreas');
        if (sortedTypes.length > 0) {
            const typeLabels = {
                'study': '📚 Study',
                'exercise': '💪 Exercise',
                'practice': '🎯 Practice',
                'work': '💼 Work'
            };
            strongestAreas.innerHTML = sortedTypes.map(([type, time]) => `
                <div class="area-item">
                    <span>${typeLabels[type] || type}</span>
                    <span>${this.formatDuration(time)}</span>
                </div>
            `).join('');
        } else {
            strongestAreas.innerHTML = '<p style="color: var(--text-secondary);">No data yet</p>';
        }
        
        // Skill hours
        const categoryStats = {};
        this.character.activities.forEach(a => {
            categoryStats[a.category] = (categoryStats[a.category] || 0) + a.duration;
        });
        
        const sortedCategories = Object.entries(categoryStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const skillHours = document.getElementById('skillHours');
        if (sortedCategories.length > 0) {
            skillHours.innerHTML = sortedCategories.map(([cat, time]) => `
                <div class="skill-item">
                    <span>${cat}</span>
                    <span>${this.formatDuration(time)}</span>
                </div>
            `).join('');
        } else {
            skillHours.innerHTML = '<p style="color: var(--text-secondary);">No data yet</p>';
        }
    }

    updateAchievements() {
        const grid = document.getElementById('achievementsGrid');
        grid.innerHTML = this.achievements.map(achievement => {
            const unlocked = achievement.unlocked;
            const date = achievement.date ? new Date(achievement.date).toLocaleDateString() : '';
            
            return `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    ${unlocked ? `<div class="achievement-date">Unlocked: ${date}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    // Shop System
    loadShopItems() {
        return {
            boosts: [
                {
                    id: 'boost_strength_5',
                    name: 'Strength Boost',
                    description: 'Permanently increase Strength by 5 points',
                    icon: '💪',
                    category: 'boosts',
                    cost: 3,
                    effect: () => {
                        this.character.stats.strength += 5;
                        this.saveCharacter();
                    }
                },
                {
                    id: 'boost_endurance_5',
                    name: 'Endurance Boost',
                    description: 'Permanently increase Endurance by 5 points',
                    icon: '🏃',
                    category: 'boosts',
                    cost: 3,
                    effect: () => {
                        this.character.stats.endurance += 5;
                        this.saveCharacter();
                    }
                },
                {
                    id: 'boost_intelligence_5',
                    name: 'Intelligence Boost',
                    description: 'Permanently increase Intelligence by 5 points',
                    icon: '🧠',
                    category: 'boosts',
                    cost: 3,
                    effect: () => {
                        this.character.stats.intelligence += 5;
                        this.saveCharacter();
                    }
                },
                {
                    id: 'boost_focus_5',
                    name: 'Focus Boost',
                    description: 'Permanently increase Focus by 5 points',
                    icon: '🎯',
                    category: 'boosts',
                    cost: 3,
                    effect: () => {
                        this.character.stats.focus += 5;
                        this.saveCharacter();
                    }
                },
                {
                    id: 'boost_all_10',
                    name: 'Complete Enhancement',
                    description: 'Increase all stats by 10 points',
                    icon: '⭐',
                    category: 'boosts',
                    cost: 15,
                    effect: () => {
                        this.character.stats.strength += 10;
                        this.character.stats.endurance += 10;
                        this.character.stats.intelligence += 10;
                        this.character.stats.focus += 10;
                        this.saveCharacter();
                    }
                }
            ],
            features: [
                {
                    id: 'feature_xp_boost',
                    name: 'XP Multiplier',
                    description: 'Gain 20% more XP from all activities',
                    icon: '⚡',
                    category: 'features',
                    cost: 10,
                    effect: () => {
                        // This will be handled in calculateXP method
                        this.saveCharacter();
                    }
                },
                {
                    id: 'feature_consistency_plus',
                    name: 'Consistency Master',
                    description: 'Increased consistency bonus rewards',
                    icon: '🔥',
                    category: 'features',
                    cost: 8,
                    effect: () => {
                        this.saveCharacter();
                    }
                },
                {
                    id: 'feature_advanced_analytics',
                    name: 'Advanced Analytics',
                    description: 'Unlock detailed growth charts and predictions',
                    icon: '📊',
                    category: 'features',
                    cost: 5,
                    effect: () => {
                        this.saveCharacter();
                    }
                },
                {
                    id: 'feature_daily_quests',
                    name: 'Daily Quests',
                    description: 'Unlock daily quest system for bonus rewards',
                    icon: '📋',
                    category: 'features',
                    cost: 12,
                    effect: () => {
                        this.saveCharacter();
                    }
                }
            ],
            quotes: [
                {
                    id: 'quote_1',
                    name: 'Motivational Quote Pack 1',
                    description: 'Unlock 3 inspiring quotes to boost your motivation',
                    icon: '💬',
                    category: 'quotes',
                    cost: 2,
                    quotes: [
                        { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
                        { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
                        { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' }
                    ]
                },
                {
                    id: 'quote_2',
                    name: 'Motivational Quote Pack 2',
                    description: 'Unlock 3 more powerful quotes',
                    icon: '💬',
                    category: 'quotes',
                    cost: 2,
                    quotes: [
                        { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
                        { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
                        { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' }
                    ]
                },
                {
                    id: 'quote_3',
                    name: 'Motivational Quote Pack 3',
                    description: 'Unlock 3 elite quotes for champions',
                    icon: '💬',
                    category: 'quotes',
                    cost: 2,
                    quotes: [
                        { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
                        { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
                        { text: 'Life is what happens to you while you\'re busy making other plans.', author: 'John Lennon' }
                    ]
                },
                {
                    id: 'quote_4',
                    name: 'Motivational Quote Pack 4',
                    description: 'Unlock 3 wisdom quotes',
                    icon: '💬',
                    category: 'quotes',
                    cost: 2,
                    quotes: [
                        { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
                        { text: 'Go confidently in the direction of your dreams. Live the life you have imagined.', author: 'Henry David Thoreau' },
                        { text: 'The two most important days in your life are the day you are born and the day you find out why.', author: 'Mark Twain' }
                    ]
                },
                {
                    id: 'quote_5',
                    name: 'Motivational Quote Pack 5',
                    description: 'Unlock 3 legendary quotes',
                    icon: '💬',
                    category: 'quotes',
                    cost: 2,
                    quotes: [
                        { text: 'Your limitation—it\'s only your imagination.', author: 'Unknown' },
                        { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
                        { text: 'Great things never come from comfort zones.', author: 'Unknown' }
                    ]
                }
            ],
            customization: [
                {
                    id: 'custom_title_elite',
                    name: 'Elite Title',
                    description: 'Unlock "Elite" title for your character',
                    icon: '👑',
                    category: 'customization',
                    cost: 5,
                    effect: () => {
                        this.saveCharacter();
                    }
                },
                {
                    id: 'custom_title_master',
                    name: 'Master Title',
                    description: 'Unlock "Master" title for your character',
                    icon: '🌟',
                    category: 'customization',
                    cost: 8,
                    effect: () => {
                        this.saveCharacter();
                    }
                },
                {
                    id: 'custom_theme_dark',
                    name: 'Dark Theme',
                    description: 'Unlock alternative dark theme',
                    icon: '🌙',
                    category: 'customization',
                    cost: 3,
                    effect: () => {
                        this.saveCharacter();
                    }
                }
            ]
        };
    }

    purchaseItem(item) {
        if (this.character.unlockedItems.includes(item.id)) {
            alert('You have already purchased this item!');
            return false;
        }

        if (this.character.stats.skillPoints < item.cost) {
            alert(`Not enough skill points! You need ${item.cost} but only have ${this.character.stats.skillPoints}.`);
            return false;
        }

        this.character.stats.skillPoints -= item.cost;
        this.character.unlockedItems.push(item.id);

        if (item.effect) {
            item.effect();
        }

        if (item.quotes) {
            item.quotes.forEach(quote => {
                if (!this.character.unlockedQuotes.find(q => q.text === quote.text)) {
                    this.character.unlockedQuotes.push(quote);
                }
            });
        }

        this.saveCharacter();
        this.updateUI();
        this.updateShop();
        
        // Show success message
        if (item.quotes) {
            alert(`Successfully purchased ${item.name}! ${item.quotes.length} quotes unlocked. Open the Reward Box to reveal them!`);
        } else {
            alert(`Successfully purchased ${item.name}!`);
        }
        
        return true;
    }

    openRewardBox() {
        if (this.character.unlockedQuotes.length === 0) {
            alert('You haven\'t unlocked any quotes yet! Purchase a quote pack from the shop.');
            return;
        }

        const modal = document.getElementById('rewardBoxModal');
        const reveal = document.getElementById('rewardBoxReveal');
        const openBtn = document.getElementById('openRewardBoxBtn');
        
        modal.classList.add('show');
        reveal.classList.remove('show');
        openBtn.style.display = 'block';

        openBtn.onclick = () => {
            this.soundSystem.playReward();
            this.vfxSystem.fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
            const randomQuote = this.character.unlockedQuotes[
                Math.floor(Math.random() * this.character.unlockedQuotes.length)
            ];
            
            document.getElementById('rewardQuoteText').textContent = `"${randomQuote.text}"`;
            document.getElementById('rewardQuoteAuthor').textContent = `— ${randomQuote.author}`;
            
            openBtn.style.display = 'none';
            reveal.classList.add('show');
        };
    }

    updateShop() {
        const shopItemsGrid = document.getElementById('shopItemsGrid');
        const activeCategory = document.querySelector('.shop-category-btn.active')?.dataset.category || 'boosts';
        const shopItems = this.loadShopItems();
        const items = shopItems[activeCategory] || [];

        if (items.length === 0) {
            shopItemsGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No items in this category.</p>';
            return;
        }

        shopItemsGrid.innerHTML = items.map((item, index) => {
            const isPurchased = this.character.unlockedItems.includes(item.id);
            const canAfford = this.character.stats.skillPoints >= item.cost;
            const itemId = `shop-item-${activeCategory}-${index}`;

            return `
                <div class="shop-item ${isPurchased ? 'purchased' : ''}" data-item-id="${item.id}">
                    ${isPurchased ? '<div class="shop-item-purchased-badge">✓ Purchased</div>' : ''}
                    <div class="shop-item-icon">${item.icon}</div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.description}</div>
                    <div class="shop-item-price">
                        <span class="shop-item-cost">${item.cost} SP</span>
                        <button class="shop-item-btn" 
                                data-item-index="${index}"
                                data-category="${activeCategory}"
                                ${isPurchased || !canAfford ? 'disabled' : ''}>
                            ${isPurchased ? 'Purchased' : 'Purchase'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to purchase buttons
        shopItemsGrid.querySelectorAll('.shop-item-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const index = parseInt(btn.dataset.itemIndex);
                const item = this.loadShopItems()[category][index];
                this.purchaseItem(item);
            });
        });

        // Update skill points display
        document.getElementById('shopSkillPoints').textContent = this.character.stats.skillPoints;
    }

    // Notifications
    showLevelUp() {
        this.soundSystem.playLevelUp();
        this.vfxSystem.fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
        
        const notification = document.getElementById('levelUpNotification');
        const levelSpan = document.getElementById('levelUpLevel');
        const rewards = document.getElementById('levelUpRewards');
        
        levelSpan.textContent = this.character.level;
        rewards.innerHTML = `
            <p>+2 Skill Points</p>
            <p>Rank: ${this.character.rank}</p>
        `;
        
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    showAchievement(achievement) {
        this.soundSystem.playNotification();
        this.vfxSystem.fireConfetti(window.innerWidth / 2, 100);
        
        const notification = document.getElementById('achievementNotification');
        const name = document.getElementById('achievementName');
        
        name.textContent = `${achievement.icon} ${achievement.name}`;
        
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateQuests() {
        const questsList = document.getElementById('questsList');
        const claimBtn = document.getElementById('claimQuestsBtn');
        const quests = this.character.dailyQuests || this.getDefaultQuests();
        
        const alreadyClaimed = this.character.activities.some(a => 
            a.type === 'quest_reward' && 
            new Date(a.date).toDateString() === new Date().toDateString()
        );

        questsList.innerHTML = quests.map((quest, index) => `
            <div class="quest-item ${quest.completed ? 'completed' : ''}" data-index="${index}">
                <div class="quest-info">
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-progress-container">
                        <div class="quest-progress-fill" style="width: ${quest.completed ? '100%' : '0%'}"></div>
                    </div>
                </div>
                <div class="quest-status">
                    ${quest.completed && !alreadyClaimed ? `Done <button class="undo-quest-btn" data-index="${index}" style="margin-left: 10px; padding: 4px 8px; font-size: 12px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; cursor: pointer;">Undo</button>` : (quest.completed ? 'Done' : 'Pending')}
                </div>
            </div>
        `).join('');

        const allCompleted = quests.every(q => q.completed);

        const rankRewards = {
            'E-Rank': { xp: 100, stats: 1 },
            'D-Rank': { xp: 200, stats: 2 },
            'C-Rank': { xp: 300, stats: 3 },
            'B-Rank': { xp: 400, stats: 4 },
            'A-Rank': { xp: 500, stats: 5 },
            'S-Rank': { xp: 1000, stats: 10 }
        };
        const reward = rankRewards[this.character.rank] || rankRewards['E-Rank'];

        if (allCompleted && !alreadyClaimed) {
            claimBtn.disabled = false;
            claimBtn.textContent = `Claim Rewards (+${reward.xp} XP, +${reward.stats} All Stats)`;
        } else if (alreadyClaimed) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Reward Claimed for Today';
        } else {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Complete all quests to claim';
        }

        // Bind clicks
        document.querySelectorAll('.quest-item:not(.completed)').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('undo-quest-btn')) return;
                const index = item.dataset.index;
                const quest = this.character.dailyQuests[index];
                if (quest.id === 'math') {
                    this.startMathQuiz(index);
                } else {
                    quest.completed = true;
                    this.soundSystem.playNotification();
                    this.saveCharacter();
                    this.updateUI();
                }
            });
        });

        document.querySelectorAll('.undo-quest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                this.character.dailyQuests[index].completed = false;
                this.saveCharacter();
                this.updateUI();
            });
        });

        claimBtn.onclick = () => {
            if (!claimBtn.disabled) {
                this.soundSystem.playReward();
                this.vfxSystem.fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
                this.logActivity('quest_reward', `Daily Quests Completed (${this.character.rank})`, 0, 1);
                
                this.character.experience += reward.xp;
                this.character.stats.strength += reward.stats;
                this.character.stats.endurance += reward.stats;
                this.character.stats.intelligence += reward.stats;
                this.character.stats.focus += reward.stats;
                
                this.addExperience(0);
                this.saveCharacter();
                this.updateUI();
                alert(`Penalty Zone Avoided!\\n\\nYou gained:\\n+${reward.xp} XP\\n+${reward.stats} Strength\\n+${reward.stats} Endurance\\n+${reward.stats} Intelligence\\n+${reward.stats} Focus`);
            }
        };
    }

    startTutorial() {
        const modal = document.getElementById('tutorialModal');
        const titleEl = document.getElementById('tutorialTitle');
        const textEl = document.getElementById('tutorialText');
        const progressEl = document.getElementById('tutorialProgress');
        const nextBtn = document.getElementById('tutorialNextBtn');
        
        const slides = [
            { title: "Welcome, Hunter", text: "The System has chosen you. This is your personal growth dashboard designed to help you level up in real life." },
            { title: "Log Activity", text: "Use the 'Log Activity' tab to track your daily study, workouts, or skills. The longer and harder the task, the more XP you gain." },
            { title: "Daily Preparation", text: "Check the 'Daily Quests' tab every day. Complete your physical training and mental math challenges to avoid the Penalty Zone." },
            { title: "Rank & Stats", text: "As you gain XP, you will level up and your Rank will increase (E-Rank to S-Rank). Higher ranks mean harder daily quests, but much better rewards!" },
            { title: "Skill Shop", text: "When you level up, you earn Skill Points (SP). Spend SP in the Shop to unlock Advanced Features, Quotes, or permanent Stat Boosts." },
            { title: "Arise", text: "Your journey begins now. Stay disciplined. Good luck." }
        ];
        
        let currentSlide = 0;
        
        const showSlide = () => {
            titleEl.textContent = slides[currentSlide].title;
            textEl.textContent = slides[currentSlide].text;
            progressEl.textContent = `${currentSlide + 1} / ${slides.length}`;
            
            if (currentSlide === slides.length - 1) {
                nextBtn.textContent = "Start Journey";
            } else {
                nextBtn.textContent = "Next";
            }
        };
        
        nextBtn.onclick = () => {
            currentSlide++;
            if (currentSlide >= slides.length) {
                modal.classList.remove('show');
                this.character.hasSeenTutorial = true;
                this.saveCharacter();
                this.soundSystem.playNotification();
                this.vfxSystem.fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
            } else {
                showSlide();
            }
        };
        
        showSlide();
        modal.classList.add('show');
    }

    startMathQuiz(questIndex) {
        const modal = document.getElementById('mathQuizModal');
        const progressEl = document.getElementById('quizProgress');
        const questionEl = document.getElementById('quizQuestion');
        const optionBtns = document.querySelectorAll('.quiz-option');
        const feedbackEl = document.getElementById('quizFeedback');
        const closeBtn = document.getElementById('closeMathQuiz');
        
        let currentQuestion = 0;
        let requiredQuestions = 1;
        let currentAnswer = 0;
        
        // Determine difficulty by rank suitable for a 16 year old
        const difficulties = {
            'E-Rank': { count: 3, ops: ['*', 'sq', '%'], mult: [11, 9], sq: [11, 4] },
            'D-Rank': { count: 5, ops: ['*', 'sq', '%', 'linear'], mult: [12, 18], sq: [12, 8] },
            'C-Rank': { count: 7, ops: ['*', 'sq', 'sqrt', '%', 'linear'], mult: [15, 25], sq: [15, 10] },
            'B-Rank': { count: 10, ops: ['*', 'sq', 'sqrt', 'linear'], mult: [20, 30], sq: [20, 15] },
            'A-Rank': { count: 12, ops: ['*', 'sq', 'linear'], mult: [30, 40], sq: [25, 25] },
            'S-Rank': { count: 15, ops: ['*', 'sq', 'linear'], mult: [40, 50], sq: [30, 30] }
        };
        
        const diff = difficulties[this.character.rank] || difficulties['E-Rank'];
        requiredQuestions = diff.count;
        
        const generateQuestion = () => {
            const type = diff.ops[Math.floor(Math.random() * diff.ops.length)];
            let questionString = '';
            
            if (type === '*') {
                let a = Math.floor(Math.random() * diff.mult[1]) + diff.mult[0];
                let b = Math.floor(Math.random() * diff.mult[1]) + diff.mult[0];
                if (['E-Rank', 'D-Rank'].includes(this.character.rank)) {
                    b = Math.floor(Math.random() * 8) + 2; 
                } else if (this.character.rank === 'C-Rank') {
                    b = Math.floor(Math.random() * 14) + 2; 
                }
                currentAnswer = a * b;
                questionString = `${a} × ${b} = ?`;
            } else if (type === 'sq') {
                let a = Math.floor(Math.random() * diff.sq[1]) + diff.sq[0];
                currentAnswer = a * a;
                questionString = `${a}² = ?`;
            } else if (type === 'sqrt') {
                let a = Math.floor(Math.random() * diff.sq[1]) + diff.sq[0];
                currentAnswer = a;
                questionString = `√${a * a} = ?`;
            } else if (type === '%') {
                const percs = [10, 15, 20, 25, 30, 40, 50, 60, 75];
                let perc = percs[Math.floor(Math.random() * percs.length)];
                let base = Math.floor(Math.random() * 25 + 1) * 20; 
                currentAnswer = (perc / 100) * base;
                questionString = `What is ${perc}% of ${base}?`;
            } else if (type === 'linear') {
                let x = Math.floor(Math.random() * 15) + 2; 
                let a = Math.floor(Math.random() * 8) + 2;  
                let b = Math.floor(Math.random() * 20) + 1; 
                let isMinus = Math.random() > 0.5;
                let c = isMinus ? (a * x) - b : (a * x) + b;
                currentAnswer = x;
                questionString = `Solve for x: ${a}x ${isMinus ? '-' : '+'} ${b} = ${c}`;
            }
            
            questionEl.textContent = questionString;
            progressEl.textContent = `Question ${currentQuestion + 1} / ${requiredQuestions}`;
            
            // Generate MCQ Options
            let options = new Set([currentAnswer]);
            while(options.size < 4) {
                let offset = Math.floor(Math.random() * 21) - 10;
                if (type === '*' || type === 'sq' || type === '%') {
                    offset = (Math.floor(Math.random() * 4) + 1) * 10 + (Math.floor(Math.random() * 5) - 2); 
                    if (Math.random() > 0.5) offset *= -1;
                }
                if (offset === 0) offset = 2;
                let wrong = currentAnswer + offset;
                if (wrong < 0 && type !== 'linear') wrong = Math.abs(wrong) + 1; 
                options.add(wrong);
            }
            
            options = Array.from(options).sort(() => Math.random() - 0.5);
            
            optionBtns.forEach((btn, i) => {
                btn.textContent = options[i];
                btn.disabled = false;
                btn.style.background = 'var(--bg-tertiary)';
                btn.onclick = () => checkAnswer(options[i], btn);
            });
        };

        const checkAnswer = (selected, btn) => {
            optionBtns.forEach(b => b.disabled = true);
            
            if (selected === currentAnswer) {
                currentQuestion++;
                this.soundSystem.playNotification();
                btn.style.background = 'var(--accent-green)';
                feedbackEl.textContent = 'Correct!';
                feedbackEl.style.color = 'var(--accent-green)';
                
                if (currentQuestion >= requiredQuestions) {
                    setTimeout(() => {
                        modal.classList.remove('show');
                        this.vfxSystem.fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
                        this.character.dailyQuests[questIndex].completed = true;
                        this.saveCharacter();
                        this.updateUI();
                    }, 800);
                } else {
                    setTimeout(() => {
                        feedbackEl.textContent = '';
                        generateQuestion();
                    }, 800);
                }
            } else {
                btn.style.background = '#ef4444';
                feedbackEl.textContent = 'Incorrect, try again.';
                feedbackEl.style.color = '#ef4444';
                
                setTimeout(() => {
                    btn.style.background = 'var(--bg-tertiary)';
                    feedbackEl.textContent = '';
                    optionBtns.forEach(b => b.disabled = false);
                }, 800);
            }
        };

        closeBtn.onclick = () => modal.classList.remove('show');
        
        // Start
        currentQuestion = 0;
        feedbackEl.textContent = '';
        generateQuestion();
        modal.classList.add('show');
    }

    // Event Listeners
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${tab}`).classList.add('active');
                
                // Update shop when shop tab is opened
                if (tab === 'shop') {
                    this.updateShop();
                }
            });
        });
        
        // Log activity
        document.getElementById('logActivityBtn').addEventListener('click', () => {
            const type = document.getElementById('activityType').value;
            const category = document.getElementById('activityCategory').value.trim();
            const hours = parseInt(document.getElementById('activityDurationHours').value) || 0;
            const minutes = parseInt(document.getElementById('activityDurationMinutes').value) || 0;
            const difficulty = document.getElementById('activityDifficulty').value;
            
            const totalDuration = (hours * 60) + minutes;
            
            if (!category) {
                alert('Please enter a category/subject');
                return;
            }
            if (totalDuration <= 0) {
                alert('Duration must be greater than 0');
                return;
            }
            
            this.logActivity(type, category, totalDuration, difficulty);
            
            // Reset form
            document.getElementById('activityCategory').value = '';
            document.getElementById('activityDurationHours').value = '0';
            document.getElementById('activityDurationMinutes').value = '30';
            document.getElementById('activityDifficulty').value = '1.5';
        });
        
        // History filter
        document.getElementById('historyFilter').addEventListener('change', () => {
            this.updateHistory();
        });
        
        // Shop category switching
        document.querySelectorAll('.shop-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shop-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateShop();
            });
        });
        
        // Reward box
        document.getElementById('openRewardBoxBtnHeader').addEventListener('click', () => {
            this.openRewardBox();
        });
        
        document.getElementById('closeRewardBox').addEventListener('click', () => {
            document.getElementById('rewardBoxModal').classList.remove('show');
        });
        
        // Close reward box on outside click
        document.getElementById('rewardBoxModal').addEventListener('click', (e) => {
            if (e.target.id === 'rewardBoxModal') {
                document.getElementById('rewardBoxModal').classList.remove('show');
            }
        });
        
        // Settings
        document.getElementById('characterNameInput').value = this.character.name;
        document.getElementById('saveNameBtn').addEventListener('click', () => {
            const newName = document.getElementById('characterNameInput').value.trim();
            if (newName) {
                this.character.name = newName;
                this.saveCharacter();
                this.updateUI();
            }
        });
        
        // Data export/import
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            const dataStr = JSON.stringify(this.character, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `solo-leveling-data-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        });
        
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        this.character = imported;
                        this.saveCharacter();
                        this.updateUI();
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Error importing data. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
}

// Initialize the system
const system = new SoloLevelingSystem();

