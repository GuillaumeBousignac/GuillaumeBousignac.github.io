window.musicPlayerState = {
    isPlaying: false,
    currentTrack: 0,
    currentPlaylist: 'day',
    switchToTrack: null,
    switchPlaylist: null
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initParallax();
    initButtonEffects();
    initFormValidation();
    initSkillAnimations();
    initProjectCards();
    initMusicPlayer();
    initThemeToggle();
});

function initMusicPlayer() {
    const player = document.querySelector('.music-player');
    const playBtn = document.querySelector('.play-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const progressBar = document.querySelector('.progress-bar-fill');
    const progressTrack = document.querySelector('.progress-bar-track');
    const progressHandle = document.querySelector('.progress-handle');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    const trackNameEl = document.querySelector('.track-name');
    const trackArtistEl = document.querySelector('.track-artist');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeValue = document.querySelector('.volume-value');
    const volumeIconBtn = document.querySelector('.volume-icon-btn');
    const audioOnImg = document.querySelector('.audio-on');
    const audioOffImg = document.querySelector('.audio-off');
    const playerToggle = document.querySelector('.player-toggle');
    const playerHeader = document.querySelector('.player-header');
    const mpdIcon = document.querySelector('.mpd-icon');

    
    const audio = new Audio();
    audio.preload = 'metadata';

    
    const playlists = {
        day: [
            {
                name: 'Main Title',
                artist: 'Ramin Djawadi',
                file: './assets/audio/Main Title.mp3'
            },
            {
                name: 'Lord of the Rings',
                artist: 'Howard Shore',
                file: './assets/audio/Lord of the Rings.mp3'
            },
            {
                name: 'Dragon Smasher',
                artist: 'Evan Call',
                file: './assets/audio/Dragon Smasher.mp3'
            },
            {
                name: 'Zoltraak',
                artist: 'Evan Call',
                file: './assets/audio/Zoltraak.mp3'
            }
        ],
        night: [
            {
                name: 'Secunda',
                artist: 'Jeremy Soule',
                file: './assets/audio/Secunda.mp3'
            },
            {
                name: 'Dark Fantasy',
                artist: 'Tiktok',
                file: './assets/audio/Dark Fantasy Tiktok Song.mp3'
            },
            {
                name: 'Rusty Sword',
                artist: 'Yukata Yamada',
                file: './assets/audio/Rusty sword.mp3'
            }
        ]
    };

    
    const savedTheme = localStorage.getItem('theme') || 'light';
    let currentPlaylist = savedTheme === 'dark' ? 'night' : 'day';
    let tracks = playlists[currentPlaylist];
    
    console.log(`🎵 Loaded ${currentPlaylist} playlist (${tracks.length} tracks)`);

    let currentTrack = 0; 
    let isPlaying = false;
    let volume = 70;
    let previousVolume = 70;
    let isMuted = false;
    let isDragging = false;
    let autoPlayEnabled = true;
    let hasUserInteracted = false;
    
    
    window.musicPlayerState.currentTrack = currentTrack;
    window.musicPlayerState.currentPlaylist = currentPlaylist;

    
    audio.volume = volume / 100;
    loadTrack(currentTrack);
    updateVolumeIcon();

    
    const startMusicOnInteraction = () => {
        if (!hasUserInteracted && autoPlayEnabled) {
            hasUserInteracted = true;
            console.log('🎵 First interaction detected, starting music...');
            playMusic();
            
            document.removeEventListener('click', startMusicOnInteraction);
            document.removeEventListener('keydown', startMusicOnInteraction);
            document.removeEventListener('mousemove', startMusicOnInteraction);
        }
    };
    
    
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    document.addEventListener('mousemove', startMusicOnInteraction, { once: true });

    
    audio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(audio.duration);
        console.log(`✅ Loaded: ${tracks[currentTrack].name} (${formatTime(audio.duration)})`);
    });

    audio.addEventListener('timeupdate', () => {
        if (!isDragging) {
            updateProgress();
        }
    });

    audio.addEventListener('ended', () => {
        console.log('🎵 Track ended, playing next...');
        currentTrack = (currentTrack + 1) % tracks.length;
        loadTrack(currentTrack);
        playMusic(); 
    });

    audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e);
        console.error('Failed to load:', tracks[currentTrack].file);
        showNotification(`Failed to load: ${tracks[currentTrack].name}`, 'error');
        
        
        setTimeout(() => {
            console.log('Trying next track...');
            nextTrack();
        }, 1500);
    });

    audio.addEventListener('loadstart', () => {
        console.log('📥 Loading audio...');
    });

    audio.addEventListener('canplay', () => {
        console.log('✅ Audio ready to play');
    });

    
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    function playMusic() {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    isPlaying = true;
                    window.musicPlayerState.isPlaying = true;
                    player.classList.add('playing');
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'block';
                    showNotification(`Now Playing: ${tracks[currentTrack].name}`, 'success');
                    playSound('click');
                    console.log('▶️ Playing:', tracks[currentTrack].name);
                })
                .catch(error => {
                    console.error('❌ Playback failed:', error);
                    showNotification('Playback failed. Try clicking play again.', 'error');
                });
        }
    }

    function pauseMusic() {
        audio.pause();
        isPlaying = false;
        window.musicPlayerState.isPlaying = false;
        autoPlayEnabled = false; 
        player.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playSound('click');
        console.log('⏸️ Paused (autoplay disabled)');
    }

    function stopMusic() {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        window.musicPlayerState.isPlaying = false;
        player.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
    
    
    function switchToTrack(trackIndex, shouldPlay) {
        currentTrack = trackIndex;
        window.musicPlayerState.currentTrack = trackIndex;
        loadTrack(trackIndex);
        if (shouldPlay) {
            setTimeout(() => playMusic(), 100);
        }
        console.log(`🔄 Switched to track ${trackIndex}: ${tracks[trackIndex].name}`);
    }
    
    
    function switchPlaylist(newPlaylist, shouldPlay) {
        currentPlaylist = newPlaylist;
        tracks = playlists[newPlaylist];
        currentTrack = 0; 
        
        window.musicPlayerState.currentPlaylist = newPlaylist;
        window.musicPlayerState.currentTrack = currentTrack;
        
        loadTrack(currentTrack);
        
        if (shouldPlay) {
            setTimeout(() => playMusic(), 100);
        }
        
        console.log(`🔄 Switched to ${newPlaylist} playlist (${tracks.length} tracks)`);
        console.log(`♪ Now ready: ${tracks[currentTrack].name}`);
    }
    
    
    window.musicPlayerState.switchToTrack = switchToTrack;
    window.musicPlayerState.switchPlaylist = switchPlaylist;

    
    prevBtn.addEventListener('click', () => {
        const wasPlaying = isPlaying;
        currentTrack = currentTrack > 0 ? currentTrack - 1 : tracks.length - 1;
        loadTrack(currentTrack);
        if (wasPlaying) {
            playMusic();
        }
        playSound('click');
    });

    
    nextBtn.addEventListener('click', () => {
        const wasPlaying = isPlaying;
        nextTrack();
        if (wasPlaying) {
            playMusic();
        }
        playSound('click');
    });

    function nextTrack() {
        currentTrack = (currentTrack + 1) % tracks.length;
        loadTrack(currentTrack);
    }

    
    function loadTrack(index) {
        stopMusic();
        const track = tracks[index];
        
        console.log(`📀 Loading track ${index + 1}/${tracks.length}: ${track.name}`);
        console.log(`📁 File: ${track.file}`);
        
        
        trackNameEl.textContent = track.name;
        trackArtistEl.textContent = track.artist;
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00';
        progressBar.style.width = '0%';
        progressHandle.style.left = '-6px';
        
        
        audio.src = track.file;
        audio.load();
        
        
    }

    
    function updateProgress() {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
            
            
            progressHandle.style.left = `calc(${progress}% - 6px)`;
        }
    }

    
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    
    progressTrack.addEventListener('click', (e) => {
        if (audio.duration) {
            const rect = progressTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = (clickX / rect.width);
            audio.currentTime = percentage * audio.duration;
            updateProgress();
            console.log(`⏩ Seeked to ${formatTime(audio.currentTime)}`);
        }
    });

    
    progressHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
        console.log('🖱️ Dragging progress bar...');
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging && audio.duration) {
            const rect = progressTrack.getBoundingClientRect();
            let clickX = e.clientX - rect.left;
            clickX = Math.max(0, Math.min(clickX, rect.width));
            const percentage = (clickX / rect.width);
            audio.currentTime = percentage * audio.duration;
            updateProgress();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            console.log(`⏩ Seeked to ${formatTime(audio.currentTime)}`);
        }
    });

    
    volumeSlider.addEventListener('input', (e) => {
        volume = parseInt(e.target.value);
        audio.volume = volume / 100;
        volumeValue.textContent = `${volume}%`;
        isMuted = volume === 0;
        if (volume === 0) {
            autoPlayEnabled = false; 
        }
        updateVolumeIcon();
    });

    
    volumeIconBtn.addEventListener('click', () => {
        if (isMuted || volume === 0) {
            
            volume = previousVolume > 0 ? previousVolume : 70;
            isMuted = false;
            console.log(`🔊 Unmuted to ${volume}%`);
        } else {
            
            previousVolume = volume;
            volume = 0;
            isMuted = true;
            autoPlayEnabled = false; 
            console.log('🔇 Muted (autoplay disabled)');
        }
        audio.volume = volume / 100;
        volumeSlider.value = volume;
        volumeValue.textContent = `${volume}%`;
        updateVolumeIcon();
        playSound('click');
    });

    function updateVolumeIcon() {
        if (isMuted || volume === 0) {
            audioOnImg.style.display = 'none';
            audioOffImg.style.display = 'block';
        } else {
            audioOnImg.style.display = 'block';
            audioOffImg.style.display = 'none';
        }
    }

    
    playerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        player.classList.toggle('minimized');
        playSound('click');
    });

    playerHeader.addEventListener('click', (e) => {
        if (e.target !== playerToggle && !playerToggle.contains(e.target)) {
            player.classList.toggle('minimized');
            playSound('click');
        }
    });

    
    document.addEventListener('keydown', (e) => {
        
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            playBtn.click();
        }
        
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            nextBtn.click();
        }
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            prevBtn.click();
        }
        
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            volume = Math.min(100, volume + 5);
            audio.volume = volume / 100;
            volumeSlider.value = volume;
            volumeValue.textContent = `${volume}%`;
            isMuted = false;
            updateVolumeIcon();
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            volume = Math.max(0, volume - 5);
            audio.volume = volume / 100;
            volumeSlider.value = volume;
            volumeValue.textContent = `${volume}%`;
            isMuted = volume === 0;
            updateVolumeIcon();
        }
    });

    
    console.log('🎵 Music Player Initialized with Real Audio Support!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 Place your MP3 files in: frontend/assets/audio/');
    console.log(`🎼 Current playlist: ${currentPlaylist.toUpperCase()}`);
    console.log(`🎵 ${tracks.length} tracks in ${currentPlaylist} playlist`);
    console.log('🎵 Music will start on first interaction (click/move mouse)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📀 ${currentPlaylist.toUpperCase()} PLAYLIST:`);
    tracks.forEach((track, i) => {
        console.log(`  ${i + 1}. ${track.name} - ${track.artist}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Switch themes to change playlists!');
    console.log('   ☀️  Day: Lord of the Rings, Main Title, Dragon Smasher, Zoltraak');
    console.log('   🌙 Night: Secunda, Dark Fantasy');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    
    setTimeout(() => {
        if (!hasUserInteracted) {
            const musicHint = document.createElement('div');
            musicHint.className = 'music-autoplay-hint';
            musicHint.innerHTML = 'Click anywhere to start the music';
            musicHint.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: rgba(255, 149, 0, 0.95);
                color: #0f0f1e;
                font-family: var(--font-medieval);
                font-size: 1rem;
                font-weight: 700;
                border: 3px solid #6b4423;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                z-index: 9998;
                animation: pulseHint 2s ease-in-out infinite;
                cursor: pointer;
            `;
            
            document.body.appendChild(musicHint);
            
            
            if (!document.querySelector('#hint-animation')) {
                const style = document.createElement('style');
                style.id = 'hint-animation';
                style.textContent = `
                    @keyframes pulseHint {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            
            const removeHint = () => {
                musicHint.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => musicHint.remove(), 500);
            };
            
            musicHint.addEventListener('click', removeHint);
            document.addEventListener('click', removeHint, { once: true });
            document.addEventListener('mousemove', removeHint, { once: true });
        }
    }, 2000);
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero-section');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinksList = document.querySelector('.nav-links');

    
    if (hamburgerBtn && navLinksList) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navLinksList.classList.toggle('open');
            hamburgerBtn.classList.toggle('open', isOpen);
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
            if (isOpen) {
                const navHeight = document.querySelector('.main-nav').offsetHeight;
                navLinksList.style.top = navHeight + 'px';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.main-nav')) {
                navLinksList.classList.remove('open');
                hamburgerBtn.classList.remove('open');
                hamburgerBtn.setAttribute('aria-expanded', false);
            }
        });
    }

    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.main-nav').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                
                if (navLinksList) {
                    navLinksList.classList.remove('open');
                    hamburgerBtn?.classList.remove('open');
                    hamburgerBtn?.setAttribute('aria-expanded', false);
                }

                
                playSound('click');
            }
        });
    });

    
    window.addEventListener('scroll', () => {
        let current = '';
        const navHeight = document.querySelector('.main-nav').offsetHeight;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });

        
        const nav = document.querySelector('.main-nav');
        if (window.pageYOffset > 50) {
            nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        } else {
            nav.style.boxShadow = 'none';
        }
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) translateX(0)';
                
                
                if (entry.target.classList.contains('skill-item')) {
                    const skillFill = entry.target.querySelector('.skill-fill');
                    if (skillFill) {
                        const width = skillFill.style.width;
                        skillFill.style.width = '0';
                        setTimeout(() => {
                            skillFill.style.width = width;
                        }, 100);
                    }
                }
            }
        });
    }, observerOptions);

    
    const animatedElements = document.querySelectorAll(
        '.wooden-panel, .project-card, .skill-item, .badge-item'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

function initParallax() {
    const parallaxLight = document.querySelector('.parallax-light');
    const parallaxDark = document.querySelector('.parallax-dark');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const parallaxSpeed = 0.5;
                const transform = `translateY(${scrolled * parallaxSpeed}px) scale(1.05)`;
                
                if (parallaxLight) {
                    parallaxLight.style.transform = transform;
                }
                if (parallaxDark) {
                    parallaxDark.style.transform = transform;
                }
                
                ticking = false;
            });
            ticking = true;
        }
    });
}

function initButtonEffects() {
    const buttons = document.querySelectorAll('.pixel-button, .project-btn');
    
    buttons.forEach(button => {
        
        button.addEventListener('mouseenter', () => {
            playSound('hover');
        });

        
        button.addEventListener('click', (e) => {
            playSound('click');
            
            
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    
    if (!document.querySelector('#ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                from {
                    transform: scale(0);
                    opacity: 1;
                }
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function initFormValidation() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = form.querySelector('input[type="text"]').value;
            const email = form.querySelector('input[type="email"]').value;
            const message = form.querySelector('textarea').value;
            
            
            if (!name || !email || !message) {
                showNotification('Please fill in all fields!', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address!', 'error');
                return;
            }
            
            
            showNotification('Quest accepted! Message sent successfully!', 'success');
            form.reset();
            playSound('success');
        });

        
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !input.checkValidity()) {
                    input.style.borderColor = '#ff4444';
                } else if (input.value) {
                    input.style.borderColor = '#5cb85c';
                }
            });

            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--color-legendary)';
            });
        });
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'info') {
    
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1.5rem 2rem;
        background: ${type === 'success' ? '#5cb85c' : '#ff4444'};
        color: white;
        font-family: var(--font-medieval);
        font-size: 1.1rem;
        font-weight: 600;
        border: 3px solid ${type === 'success' ? '#4a9a4a' : '#cc0000'};
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        z-index: 10000;
        animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 3.5s;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3500);

    
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(500px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(500px);
                    opacity: 0;
                }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

function initSkillAnimations() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                    
                    const skillFill = entry.target.querySelector('.skill-fill');
                    if (skillFill) {
                        skillFill.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    }
                }, index * 100);
            }
        });
    }, {
        threshold: 0.2
    });

    skillItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = 'all 0.6s ease-out';
        observer.observe(item);
    });
}

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-8px)
                scale(1.02)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });

        
        const viewBtn = card.querySelector('.view-btn');
        const codeBtn = card.querySelector('.code-btn');

        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                const projectTitle = card.querySelector('.project-title').textContent;
                showNotification(`Opening quest: ${projectTitle} !`, 'success');
            });
        }

        if (codeBtn) {
            codeBtn.addEventListener('click', () => {
                const projectTitle = card.querySelector('.project-title').textContent;
                showNotification(`Viewing source code for: ${projectTitle} !`, 'success');
            });
        }
    });
}

const sounds = {
    click: 440,
    hover: 523,
    success: 659
};

function playSound(type) {
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = sounds[type] || 440;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        
        console.log('Audio not available');
    }
}

let secretCode = '';
const secretSequence = 'pixel';

document.addEventListener('keypress', (e) => {
    secretCode += e.key.toLowerCase();
    
    if (secretCode.length > secretSequence.length) {
        secretCode = secretCode.slice(-secretSequence.length);
    }
    
    if (secretCode === secretSequence) {
        activateSecretMode();
        secretCode = '';
    }
});

function activateSecretMode() {
    showNotification('SECRET MODE ACTIVATED!', 'success');
    
    
    const title = document.querySelector('.title-main');
    if (title) {
        title.style.animation = 'rainbow 2s linear infinite';
        
        if (!document.querySelector('#rainbow-animation')) {
            const style = document.createElement('style');
            style.id = 'rainbow-animation';
            style.textContent = `
                @keyframes rainbow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        
        setTimeout(() => {
            title.style.animation = 'titlePulse 3s ease-in-out infinite';
        }, 5000);
    }
    
    playSound('success');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

const style = document.createElement('style');
style.textContent = `
    .keyboard-nav *:focus {
        outline: 3px solid var(--color-legendary) !important;
        outline-offset: 2px;
    }
`;
document.head.appendChild(style);

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const body = document.body;
    
    
    const firefliesContainer = document.createElement('div');
    firefliesContainer.className = 'fireflies';
    for (let i = 0; i < 15; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefliesContainer.appendChild(firefly);
    }
    document.body.appendChild(firefliesContainer);
    
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
    
    
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    document.body.appendChild(overlay);
    
    themeToggle.addEventListener('click', () => {
        
        overlay.classList.add('active');
        
        
        playSound('click');
        
        
        setTimeout(() => {
            const wasPlaying = window.musicPlayerState && window.musicPlayerState.isPlaying;
            
            body.classList.toggle('dark-theme');
            
            
            if (body.classList.contains('dark-theme')) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                localStorage.setItem('theme', 'dark');
                showNotification('Night Theme Activated', 'success');
                console.log('🌙 Switched to dark theme');
                
                
                if (window.musicPlayerState && window.musicPlayerState.switchPlaylist) {
                    window.musicPlayerState.switchPlaylist('night', wasPlaying);
                }
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                localStorage.setItem('theme', 'light');
                showNotification('Day Theme Activated', 'success');
                console.log('☀️ Switched to light theme');
                
                
                if (window.musicPlayerState && window.musicPlayerState.switchPlaylist) {
                    window.musicPlayerState.switchPlaylist('day', wasPlaying);
                }
            }
            
            
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 100);
        }, 400);
    });
    
    console.log(`🎨 Theme system initialized (Current: ${savedTheme})`);
}

console.log(`
%c⚔ FANTASY PIXEL REALM ⚔
%cWelcome, brave developer!
You've discovered the console. 
Try typing 'pixel' while on the page for a secret!
`, 
'color: #ff9500; font-size: 20px; font-weight: bold;',
'color: #f5e6d3; font-size: 14px;'
);

(function initContactForm() {
    
    const EMAILJS_PUBLIC_KEY  = 'OhTF-gx7Nk2DZlIsb';   
    const EMAILJS_SERVICE_ID  = 'service_qmvmi78';   
    const EMAILJS_TEMPLATE_ID = 'template_vdluwur';  

    emailjs.init(EMAILJS_PUBLIC_KEY);

    const form       = document.getElementById('contact-form');
    const submitBtn  = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const feedback   = document.getElementById('form-feedback');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        
        submitBtn.disabled = true;
        submitText.textContent = 'Sending...';
        feedback.style.display = 'none';

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
            .then(() => {
                feedback.textContent = '✔ Message sent! I will reply soon, adventurer.';
                feedback.className = 'form-feedback success';
                feedback.style.display = 'block';
                form.reset();
            })
            .catch((error) => {
                console.error('EmailJS error:', error);
                const detail = error?.text || error?.message || JSON.stringify(error);
                feedback.textContent = `✖ Error: ${detail}`;
                feedback.className = 'form-feedback error';
                feedback.style.display = 'block';
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitText.textContent = 'Send Message';
            });
    });
})();

(function initGithubProjects() {
    const RARITY_CONFIG = {
        legendary: { stars: 3, borderClass: 'legendary-border', badgeClass: 'legendary' },
        epic:      { stars: 2, borderClass: 'epic-border',      badgeClass: 'epic'      },
        rare:      { stars: 1, borderClass: 'rare-border',      badgeClass: 'rare'      }
    };

    const LANG_COLORS = {
        JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
        HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', React: '#61dafb',
        Java: '#b07219', C: '#555555', 'C++': '#f34b7d', Go: '#00ADD8',
        Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95', Shell: '#89e051',
        Dockerfile: '#384d54', Makefile: '#589e22'
    };

    function buildStars(count) {
        return Array.from({ length: count }, () => '<i class="fa-solid fa-star"></i>').join('');
    }

    function buildCard(project, repoData, languages) {
        const rarity  = project.rarity || 'rare';
        const cfg     = RARITY_CONFIG[rarity] || RARITY_CONFIG.rare;
        const title   = project.custom_title   || repoData.name.replace(/[-_]/g, ' ');
        const desc    = project.custom_description || repoData.description || 'No description available.';
        const rating  = project.rating ? project.rating.toFixed(1) : '—';
        const repoUrl  = repoData.html_url;
        const viewUrl  = project.custom_url || `${repoUrl}/tree/main`;

        const techTags = Object.keys(languages).slice(0, 4).map(lang => {
            const color = LANG_COLORS[lang] || '#888';
            return `<span class="tech-tag" style="border-color:${color};color:${color};background:${color}18">${lang}</span>`;
        }).join('');

        return `
        <div class="project-card wooden-panel">
            <div class="project-header ${cfg.borderClass}">
                <h3 class="project-title">${title}</h3>
                <span class="project-badge ${cfg.badgeClass}">${buildStars(cfg.stars)}</span>
            </div>
            <div class="project-content">
                <p class="project-description">${desc}</p>
                <div class="project-tech">${techTags || '<span class="tech-tag">Code</span>'}</div>
                <div class="project-stats">
                    <div class="stat">
                        <span class="stat-label">Rating:</span>
                        <span class="stat-value">${rating}/5</span>
                    </div>
                </div>
            </div>
            <div class="project-footer">
                <a href="${viewUrl}" target="_blank" rel="noopener" class="project-btn view-btn">View Quest</a>
                <a href="${repoUrl}" target="_blank" rel="noopener" class="project-btn code-btn">Source Code</a>
            </div>
        </div>`;
    }

    async function fetchLanguages(username, repo) {
        try {
            const res = await fetch(`https://api.github.com/repos/${username}/${repo}/languages`);
            if (!res.ok) return {};
            return await res.json();
        } catch { return {}; }
    }

    async function loadProjects() {
        const grid = document.querySelector('.projects-grid');
        if (!grid) return;

        grid.innerHTML = '<div class="projects-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading quests...</div>';

        let config;
        try {
            const res = await fetch('./assets/projects-config.json');
            config = await res.json();
        } catch (e) {
            grid.innerHTML = '<p class="projects-error">Could not load projects config.</p>';
            return;
        }

        const { github_username, projects } = config;

        const cards = await Promise.all(projects.map(async (project) => {
            try {
                const [repoRes, languages] = await Promise.all([
                    fetch(`https://api.github.com/repos/${github_username}/${project.repo}`),
                    fetchLanguages(github_username, project.repo)
                ]);
                if (!repoRes.ok) return null;
                const repoData = await repoRes.json();
                return buildCard(project, repoData, languages);
            } catch { return null; }
        }));

        const validCards = cards.filter(Boolean);
        grid.innerHTML = validCards.length > 0
            ? validCards.join('')
            : '<p class="projects-error">No projects found.</p>';

        if (typeof initProjectCards === 'function') initProjectCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjects);
    } else {
        loadProjects();
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification,
        playSound
    };
}