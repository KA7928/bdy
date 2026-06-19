/* ==========================================================================
   Romantic Birthday Website - Interactive Logic & Audio Synth
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // === 1. LOADING SCREEN DISMISS ===
    const loader = document.getElementById('loader');
    
    // Add loading class to body to disable scroll during load
    document.body.classList.add('loading');
    
    let loaderDismissed = false;
    function dismissLoader() {
        if (loaderDismissed) return;
        loaderDismissed = true;
        
        setTimeout(() => {
            loader.classList.add('fade-out');
            document.body.classList.remove('loading');
            
            // Remove from DOM after fade animation is complete
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 1200); // Small delay for visual aesthetic
    }

    window.addEventListener('load', dismissLoader);
    // Safety fallback: dismiss loader after 4.5 seconds maximum
    setTimeout(dismissLoader, 4500);


    // === 2. NAVIGATION & ROUTING ===
    const landingPage = document.getElementById('landing-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const enterBtn = document.getElementById('enter-heart-btn');
    const subpages = document.querySelectorAll('.subpage-overlay');
    const cards = document.querySelectorAll('.dashboard-card');

    // Wishes audio variables
    const wishesAudio = document.getElementById('wishes-audio');

    // Kuch Baatein audio
    const baateinAudio = document.getElementById('baatein-audio');

    // Global navigation tracking
    let wasSynthPlayingBeforeSubpage = false;

    // Opening Dashboard Cards (Subpages)
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.getAttribute('data-target');
            
            // Play audio directly on user gesture for iOS/Safari compliance
            if (targetId === 'wishes-subpage' && wishesAudio) {
                wishesAudio.currentTime = 0;
                wishesAudio.play().catch(err => console.log("Direct wishes play failed:", err));
            } else if (targetId === 'baatein-subpage' && baateinAudio) {
                baateinAudio.currentTime = 0;
                baateinAudio.play().catch(err => console.log("Direct baatein play failed:", err));
            }
            
            window.location.hash = targetId;
        });
    });

    // In-app Back Buttons
    subpages.forEach(subpage => {
        const backBtn = subpage.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.hash = 'dashboard';
            });
        }
    });

    // Return to Dashboard Buttons (on baatein + arguments pages)
    document.querySelectorAll('.btn-return-dashboard').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = 'dashboard';
        });
    });

    // Click "Enter My Heart" to go to Dashboard
    enterBtn.addEventListener('click', () => {
        // Heartburst effect on click
        createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 40);
        
        // Pre-activate/Unlock audio elements on iOS/Safari via play/pause cycle
        [wishesAudio, baateinAudio, secretAudio, cakeAudio].forEach(audio => {
            if (audio) {
                audio.play().then(() => {
                    audio.pause();
                }).catch(err => {
                    console.log("Audio pre-unlock status:", err);
                });
            }
        });
        
        window.location.hash = 'dashboard';
    });

    // Central Navigation routing handler
    function handleNavigation() {
        const hash = window.location.hash.substring(1); // Get hash without '#'

        if (hash === '' || hash === 'landing') {
            // Show Landing Page, Hide Dashboard & Subpages
            landingPage.classList.remove('hidden');
            void landingPage.offsetWidth;
            landingPage.classList.add('active');
            landingPage.style.opacity = '1';
            landingPage.style.transform = 'scale(1)';

            dashboardPage.classList.add('hidden');
            dashboardPage.classList.remove('active');

            // Close all subpage overlays
            subpages.forEach(subpage => {
                subpage.classList.remove('active');
                subpage.classList.add('hidden');
            });

            // Pause all page audios
            stopAllSubpageAudios();
            if (wasSynthPlayingBeforeSubpage) {
                startSynth();
                wasSynthPlayingBeforeSubpage = false;
            }
        } 
        else if (hash === 'dashboard') {
            // Transition from Landing page to Dashboard if landing is active
            if (landingPage.classList.contains('active') || !landingPage.classList.contains('hidden')) {
                landingPage.style.opacity = '0';
                landingPage.style.transform = 'scale(0.95) translateY(20px)';
                setTimeout(() => {
                    landingPage.classList.add('hidden');
                    landingPage.classList.remove('active');

                    dashboardPage.classList.remove('hidden');
                    void dashboardPage.offsetWidth;
                    dashboardPage.classList.add('active');
                }, 600);
            } else {
                dashboardPage.classList.remove('hidden');
                void dashboardPage.offsetWidth;
                dashboardPage.classList.add('active');
            }

            // Close all subpage overlays (with animation)
            subpages.forEach(subpage => {
                if (subpage.classList.contains('active')) {
                    subpage.classList.remove('active');
                    
                    // Reset passcode locked screen states when closed
                    if (subpage.id === 'memories-subpage') {
                        setTimeout(() => {
                            const lockScreen = document.getElementById('memories-lock-screen');
                            const unlockedContent = document.getElementById('memories-content');
                            const passcodeInput = document.getElementById('passcode-input');
                            const lockErrorMsg = document.getElementById('lock-error-msg');
                            if (lockScreen && unlockedContent) {
                                lockScreen.style.opacity = '1';
                                lockScreen.style.transform = 'scale(1)';
                                lockScreen.classList.remove('hidden');
                                lockScreen.classList.remove('shake-anim');
                                unlockedContent.classList.add('hidden');
                                if (lockErrorMsg) lockErrorMsg.classList.add('hidden');
                                if (passcodeInput) passcodeInput.value = '';
                                
                                // Unload PDFs to free memory resources
                                unlockedContent.querySelectorAll('iframe').forEach(iframe => {
                                    iframe.removeAttribute('src');
                                });
                            }
                        }, 500);
                    }
                    if (subpage.id === 'cake-subpage') {
                        stopMicDetection();
                        setTimeout(() => resetCakeCeremony(), 600);
                    }

                    setTimeout(() => {
                        subpage.classList.add('hidden');
                    }, 500);
                } else {
                    subpage.classList.add('hidden');
                }
            });

            // Pause all page-specific audios
            stopAllSubpageAudios();

            // Resume ambient synth if it was playing before
            if (wasSynthPlayingBeforeSubpage) {
                startSynth();
                wasSynthPlayingBeforeSubpage = false;
            }
        } 
        else {
            // We are opening a subpage
            const targetPage = document.getElementById(hash);
            if (targetPage) {
                // Ensure landing is hidden, dashboard is shown (underneath overlay)
                landingPage.classList.add('hidden');
                landingPage.classList.remove('active');
                dashboardPage.classList.remove('hidden');
                dashboardPage.classList.add('active');

                // Open subpage overlay
                targetPage.classList.remove('hidden');
                void targetPage.offsetWidth;
                targetPage.classList.add('active');

                // Scroll to top
                const container = targetPage.querySelector('.subpage-container');
                if (container) container.scrollTop = 0;

                // Stop other page-specific audios
                stopAllSubpageAudios();

                // Save synth state and pause it
                if (isSynthPlaying) {
                    stopSynth();
                    wasSynthPlayingBeforeSubpage = true;
                }

                // Page-specific activation logic
                if (hash === 'wishes-subpage') {
                    if (wishesAudio && wishesAudio.paused) {
                        wishesAudio.currentTime = 0;
                        wishesAudio.play().catch(err => console.log("Wishes audio playback failed:", err));
                    }
                }
                else if (hash === 'baatein-subpage') {
                    if (baateinAudio && baateinAudio.paused) {
                        baateinAudio.currentTime = 0;
                        baateinAudio.play().catch(err => console.log("Baatein audio playback failed:", err));
                    }
                }
                else if (hash === 'cake-subpage') {
                    setTimeout(() => onCakeCeremonyEnter(), 300);
                }
            }
        }
    }

    function stopAllSubpageAudios() {
        if (wishesAudio) wishesAudio.pause();
        if (baateinAudio) baateinAudio.pause();
        if (secretAudio) secretAudio.pause();
        if (cakeAudio) { cakeAudio.pause(); cakeAudio.currentTime = 0; }
    }

    // Bind hashchange listener
    window.addEventListener('hashchange', handleNavigation);
    
    // Initial load handler
    handleNavigation();


    // === 3. CANVAS PARTICLE SYSTEM ===
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    
    // Resize Canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle Classes
    class HeartParticle {
        constructor(x, y, size, color, speedX, speedY, spinSpeed, decay) {
            this.x = x;
            this.y = y;
            this.size = size || Math.random() * 12 + 6;
            this.color = color || 'rgba(255, 141, 161, 0.85)';
            this.speedX = speedX || (Math.random() - 0.5) * 4;
            this.speedY = speedY || -Math.random() * 3 - 2; // Floating upwards
            this.spin = Math.random() * Math.PI * 2;
            this.spinSpeed = spinSpeed || (Math.random() - 0.5) * 0.04;
            this.decay = decay || Math.random() * 0.008 + 0.005;
            this.alpha = 1;
            this.driftPhase = Math.random() * 100;
            this.driftSpeed = Math.random() * 0.02 + 0.01;
            this.type = 'heart';
        }

        update() {
            this.x += this.speedX + Math.sin(this.driftPhase) * 0.4;
            this.y += this.speedY;
            this.spin += this.spinSpeed;
            this.driftPhase += this.driftSpeed;
            this.alpha -= this.decay;
            if (this.size > 0.1) this.size -= 0.02;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spin);
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            
            // Draw heart via Bezier curves
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, s / 4);
            ctx.bezierCurveTo(0, -s / 2, -s, -s / 2, -s, s / 4);
            ctx.bezierCurveTo(-s, (s * 1.1) / 2, -s / 3, (s * 1.6) / 2, 0, s * 1.2);
            ctx.bezierCurveTo(s / 3, (s * 1.6) / 2, s, (s * 1.1) / 2, s, s / 4);
            ctx.bezierCurveTo(s, -s / 2, 0, -s / 2, 0, s / 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    class SparkleParticle {
        constructor(x, y, size, color, speedX, speedY, decay) {
            this.x = x;
            this.y = y;
            this.size = size || Math.random() * 6 + 3;
            this.color = color || 'rgba(255, 223, 137, 0.9)'; // Golden-yellow
            this.speedX = speedX || (Math.random() - 0.5) * 3;
            this.speedY = speedY || (Math.random() - 0.5) * 3 - 0.5;
            this.decay = decay || Math.random() * 0.015 + 0.01;
            this.alpha = 1;
            this.type = 'sparkle';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            
            // Draw 4-pointed sparkle star
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // Function to generate particle bursts
    function createHeartBurst(x, y, count = 15) {
        const colors = [
            'rgba(255, 141, 161, 0.95)',  // Soft Rose
            'rgba(255, 214, 231, 0.95)',  // Light Pink
            'rgba(255, 105, 180, 0.9)',   // Hot Pink
            'rgba(255, 240, 245, 0.95)',  // Lavender Blush
            'rgba(214, 175, 55, 0.9)'      // Gold Spark
        ];

        for (let i = 0; i < count; i++) {
            const size = Math.random() * 14 + 6;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 5 + 1.5;
            const speedX = Math.cos(angle) * force;
            const speedY = Math.sin(angle) * force - 1.5; // Slight bias upwards
            
            // Randomly create hearts and sparkles
            if (Math.random() > 0.35) {
                particles.push(new HeartParticle(x, y, size, color, speedX, speedY, null, null));
            } else {
                particles.push(new SparkleParticle(x, y, size / 2, 'rgba(255, 223, 137, 0.95)', speedX * 0.7, speedY * 0.7, null));
            }
        }
    }

    // Canvas rendering loop
    function updateAndDrawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background slow floaters (ambient particles) - Density increased
        if (Math.random() < 0.45) {
            const x = Math.random() * canvas.width;
            const y = canvas.height + 20;
            const size = Math.random() * 12 + 4;
            const speedY = -Math.random() * 0.6 - 0.3; // Floating up slowly
            const decay = Math.random() * 0.001 + 0.0005; // Fade out slowly so they reach higher
            
            const colors = [
                'rgba(255, 141, 161, 0.25)', // Soft Rose
                'rgba(255, 214, 231, 0.25)', // Light Pink
                'rgba(255, 182, 193, 0.25)', // Pastel Pink
                'rgba(255, 255, 255, 0.22)', // Soft White
                'rgba(214, 175, 55, 0.15)'   // Ambient Gold Spark
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // 70% hearts, 30% sparkles for a gorgeous mix
            if (Math.random() > 0.3) {
                particles.push(new HeartParticle(x, y, size, color, (Math.random() - 0.5) * 0.4, speedY, null, decay));
            } else {
                particles.push(new SparkleParticle(x, y, size / 2.2, color, (Math.random() - 0.5) * 0.4, speedY, decay));
            }
        }

        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            // Remove dead particles
            if (p.alpha <= 0 || p.size <= 0.1) {
                particles.splice(idx, 1);
            }
        });

        requestAnimationFrame(updateAndDrawParticles);
    }
    updateAndDrawParticles();

    // Generate heart bursts on user clicks/taps
    window.addEventListener('click', (e) => {
        // Avoid triggers if clicking on buttons or navigation cards
        if (e.target.closest('#music-btn') || e.target.closest('.back-btn') || e.target.closest('.btn-enter-heart')) {
            return;
        }
        createHeartBurst(e.clientX, e.clientY, 5);
    });

    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#music-btn') || e.target.closest('.back-btn') || e.target.closest('.btn-enter-heart')) {
            return;
        }
        const touch = e.touches[0];
        createHeartBurst(touch.clientX, touch.clientY, 5);
    });


    // === 4. MOUSE SPARKLE TRAIL ===
    let mouseX = 0, mouseY = 0;
    let lastCursorEmitX = 0, lastCursorEmitY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Show cursor trails under minor speed distance checks
        const dist = Math.hypot(mouseX - lastCursorEmitX, mouseY - lastCursorEmitY);
        if (dist > 25) {
            // Emit cursor trail sparkles
            if (Math.random() > 0.4) {
                particles.push(new SparkleParticle(
                    mouseX, 
                    mouseY, 
                    Math.random() * 4 + 2, 
                    'rgba(255, 141, 161, 0.45)', 
                    (Math.random() - 0.5) * 1.2, 
                    (Math.random() - 0.5) * 1.2, 
                    0.02
                ));
            }
            lastCursorEmitX = mouseX;
            lastCursorEmitY = mouseY;
        }
    });


    // === 5. MOUSE PARALLAX EFFECT ===
    const orbs = [
        document.querySelector('.orb-1'),
        document.querySelector('.orb-2'),
        document.querySelector('.orb-3')
    ];

    window.addEventListener('mousemove', (e) => {
        const normX = (e.clientX / window.innerWidth) - 0.5; // -0.5 to 0.5
        const normY = (e.clientY / window.innerHeight) - 0.5;

        // Drift background ambient orbs subtly in opposite directions
        if (orbs[0]) orbs[0].style.transform = `translate(${normX * -40}px, ${normY * -40}px)`;
        if (orbs[1]) orbs[1].style.transform = `translate(${normX * 60}px, ${normY * 60}px) scale(1.1) rotate(180deg)`;
        if (orbs[2]) orbs[2].style.transform = `translate(${normX * -30}px, ${normY * 30}px)`;
        
        // Subtle tilt/drift on active hero card
        const heroCard = document.querySelector('.hero-card');
        if (heroCard && !landingPage.classList.contains('hidden')) {
            heroCard.style.transform = `rotateY(${normX * 10}deg) rotateX(${normY * -10}deg)`;
        }
    });


    // === 6. WEB AUDIO API ROMANTIC SYNTHESIZER ===
    const musicBtn = document.getElementById('music-btn');
    const iconOff = musicBtn.querySelector('.icon-off');
    const iconOn = musicBtn.querySelector('.icon-on');
    
    let audioCtx = null;
    let masterGain = null;
    let synthIntervalId = null;
    let isSynthPlaying = false;
    let synthTime = 0;

    // Sweet, romantic chord progression frequencies: Cmaj9 -> Am9 -> Fmaj7 -> G6/9
    const chordProgression = [
        [130.81, 196.00, 246.94, 293.66, 329.63], // Cmaj9 (C3, G3, B3, D4, E4)
        [110.00, 164.81, 196.00, 246.94, 261.63], // Am9 (A2, E3, G3, B3, C4)
        [87.31, 130.81, 164.81, 220.00, 261.63],  // Fmaj7 (F2, C3, E3, A3, C4)
        [98.00, 146.83, 220.00, 246.94, 329.63]   // G6/9 (G2, D3, A3, B3, E4)
    ];

    let chordIndex = 0;

    function initAudio() {
        if (audioCtx) return;

        // Create audio context
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master Gain Node for soft background volume
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Low background volume

        // Delay Node for lush dreamy echo effect
        const delay = audioCtx.createDelay(1.0);
        delay.delayTime.setValueAtTime(0.5, audioCtx.currentTime); // 500ms delay

        const feedback = audioCtx.createGain();
        feedback.gain.setValueAtTime(0.4, audioCtx.currentTime); // 40% feedback

        // Connect delay loop
        delay.connect(feedback);
        feedback.connect(delay);

        // Biquad filter to make synth notes soft and round (remove harsh high frequencies)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, audioCtx.currentTime);

        // Connect audio graph
        // synth -> filter -> masterGain -> destination
        //            \-----> delay ------> masterGain
        filter.connect(masterGain);
        filter.connect(delay);
        delay.connect(masterGain);
        masterGain.connect(audioCtx.destination);
    }

    function playSynthNote(freq, startTime, duration) {
        if (!audioCtx) return;

        // Create a triangle oscillator for a soft, woody chime sound
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Create specific gain envelope for note volume ADSR
        const noteGain = audioCtx.createGain();
        noteGain.gain.setValueAtTime(0, startTime);
        // Attack: smooth swell
        noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.15);
        // Decay/Release: long beautiful fade
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        // Filter envelope: start bright and darken gradually
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, startTime);
        filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);

        // Connections
        osc.connect(filter);
        filter.connect(noteGain);
        // Connect to Master Node (which filters and forwards to destination/delay)
        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // Melodic arpeggio sequencer
    function playNextChords() {
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const currentChord = chordProgression[chordIndex];
        
        // Play root note long and deep
        playSynthNote(currentChord[0], now, 3.5);
        
        // Arpeggiate the higher chord notes (creating a dreamy ambient arpeggio)
        currentChord.slice(1).forEach((freq, idx) => {
            // Play each note with a staggered delay of 0.4s
            playSynthNote(freq, now + 0.4 * (idx + 1), 3.0);
        });

        // Add a soft high-register bell chime randomly for extra magic
        if (Math.random() > 0.4) {
            const highNotes = [currentChord[3] * 2, currentChord[4] * 2]; // 1 octave higher
            const randomHighNote = highNotes[Math.floor(Math.random() * highNotes.length)];
            playSynthNote(randomHighNote, now + 1.8 + Math.random() * 0.5, 2.5);
        }

        // Loop to next chord
        chordIndex = (chordIndex + 1) % chordProgression.length;
    }

    function startSynth() {
        initAudio();
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isSynthPlaying = true;
        
        // Play immediately, then trigger loop every 4.5 seconds
        playNextChords();
        synthIntervalId = setInterval(playNextChords, 4500);

        // Update UI
        iconOff.classList.add('hidden');
        iconOn.classList.remove('hidden');
    }

    function stopSynth() {
        if (synthIntervalId) {
            clearInterval(synthIntervalId);
            synthIntervalId = null;
        }
        isSynthPlaying = false;
        
        // Update UI
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
    }

    // Toggle Music Button Click Listener
    musicBtn.addEventListener('click', () => {
        if (isSynthPlaying) {
            stopSynth();
        } else {
            startSynth();
        }
    });

    // === 7. LOCKED MEMORIES PAGE AUTHORIZATION ===
    const lockScreen = document.getElementById('memories-lock-screen');
    const unlockedContent = document.getElementById('memories-content');
    const passcodeInput = document.getElementById('passcode-input');
    const unlockBtn = document.getElementById('unlock-btn');
    const lockErrorMsg = document.getElementById('lock-error-msg');
    const secretAudio = document.getElementById('secret-audio');

    const CORRECT_PASSCODE = 'KSP277038AC2YRSINLV18BDY';
    let wasSynthPlayingBeforeSecret = false;

    if (unlockBtn && passcodeInput) {
        unlockBtn.addEventListener('click', attemptUnlock);
        passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptUnlock();
        });
    }

    function attemptUnlock() {
        if (!passcodeInput || !lockScreen || !unlockedContent) return;

        const enteredCode = passcodeInput.value.trim().toUpperCase();
        if (enteredCode === CORRECT_PASSCODE) {
            // Clear error
            if (lockErrorMsg) lockErrorMsg.classList.add('hidden');
            lockScreen.classList.remove('shake-anim');

            // Transition: Fade out Lock Screen
            lockScreen.style.opacity = '0';
            lockScreen.style.transform = 'scale(0.95)';

            setTimeout(() => {
                lockScreen.classList.add('hidden');
                unlockedContent.classList.remove('hidden');
                unlockedContent.style.opacity = '0';
                void unlockedContent.offsetWidth; // Force Reflow
                unlockedContent.style.opacity = '1';

                // Load active tab's PDF dynamically
                const activePanel = unlockedContent.querySelector('.tab-panel.active');
                if (activePanel) {
                    const iframe = activePanel.querySelector('iframe');
                    if (iframe && !iframe.src) {
                        iframe.src = iframe.getAttribute('data-src');
                    }
                }

                // Pause background music if playing
                if (isSynthPlaying) {
                    stopSynth();
                    wasSynthPlayingBeforeSecret = true;
                } else {
                    wasSynthPlayingBeforeSecret = false;
                }

                // Pause wishes voice audio if running
                if (wishesAudio) wishesAudio.pause();

                // Play Secret page background song
                if (secretAudio) {
                    secretAudio.currentTime = 0;
                    secretAudio.play().catch(err => console.log("Secret audio play failed:", err));
                }
            }, 400);
        } else {
            // Shake passcode container and prompt error
            lockScreen.classList.remove('shake-anim');
            void lockScreen.offsetWidth; // Reflow
            lockScreen.classList.add('shake-anim');
            if (lockErrorMsg) lockErrorMsg.classList.remove('hidden');
            passcodeInput.value = '';
            passcodeInput.focus();
        }
    }

    // Toggle PDF Tab views
    const tabBtns = document.querySelectorAll('.memories-tabs .tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTabId = btn.getAttribute('data-tab');

            // Set active states on buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Hide/Show correct PDF viewer
            tabPanels.forEach(panel => {
                if (panel.id === targetTabId) {
                    panel.classList.remove('hidden');
                    panel.classList.add('active');
                    
                    // Lazy-load PDF on tab switch
                    const iframe = panel.querySelector('iframe');
                    if (iframe && !iframe.src) {
                        iframe.src = iframe.getAttribute('data-src');
                    }
                } else {
                    panel.classList.add('hidden');
                    panel.classList.remove('active');
                }
            });
        });
    });


    // =====================================================================
    // === 8. CAKE CUTTING CEREMONY LOGIC ===
    // =====================================================================

    const cakeSubpage      = document.getElementById('cake-subpage');
    const cakeAudio        = document.getElementById('cake-audio');
    const cakePopup        = document.getElementById('cake-popup');
    const popupTitle       = document.getElementById('popup-title');
    const popupDesc        = document.getElementById('popup-desc');
    const popupActionBtn   = document.getElementById('popup-action-btn');
    const fallbackBlowBtn  = document.getElementById('fallback-blow-btn');
    const selfieCamBox     = document.getElementById('selfie-cam-container');
    const cakeWebcam       = document.getElementById('cake-webcam');
    const blowLevelBar     = document.getElementById('blow-level-bar');
    const cakeKnifeBox     = document.getElementById('cake-knife-container');
    const grabKnifeBtn     = document.getElementById('grab-knife-btn');
    const feedingContainer = document.getElementById('feeding-container');
    const selfEatContainer = document.getElementById('self-eat-container');
    const selfEatBtn       = document.getElementById('self-eat-btn');
    const flyingSlice      = document.getElementById('flying-cake-slice');
    const cakeCutLine      = document.getElementById('cake-cut-line');
    const candleFlames     = document.querySelectorAll('.candle-flame');
    const candleSmokes     = document.querySelectorAll('.candle-smoke');
    const avatarCards      = document.querySelectorAll('.avatar-card');
    const birthdayCake     = document.getElementById('birthday-cake');

    // State variables for ceremony
    let cakeCeremonyStage  = 'idle';   // idle → blowing → blown → cutting → feeding → done
    let knifeGrabbed       = false;
    let fedCount           = 0;
    let micStream          = null;
    let blowAudioCtx       = null;
    let blowAnalyser       = null;
    let blowDetectInterval = null;
    let blowFrameId        = null;
    let wasSynthBeforeCake = false;
    let cakeCutDone        = false;

    // Helper: reset the ceremony state fully
    function resetCakeCeremony() {
        cakeCeremonyStage = 'idle';
        knifeGrabbed = false;
        fedCount = 0;
        cakeCutDone = false;

        // Re-light all candles
        candleFlames.forEach(f => {
            f.classList.add('lit');
            f.classList.remove('blown');
        });
        candleSmokes.forEach(s => s.classList.remove('active'));

        // Reset popup
        popupTitle.textContent = 'Make a wish, bacchua! 💖';
        popupDesc.textContent = 'The candles are ready. Ready to blow them out?';
        popupActionBtn.textContent = 'Blow your candles, bacchua 🕯️💨';
        popupActionBtn.classList.remove('hidden');
        fallbackBlowBtn.classList.add('hidden');
        cakePopup.classList.remove('hidden');

        // Hide all later stages
        selfieCamBox.classList.add('hidden');
        cakeKnifeBox.classList.add('hidden');
        feedingContainer.classList.add('hidden');
        selfEatContainer.classList.add('hidden');
        cakeCutLine.classList.remove('active');

        // Reset knife style
        const knifeSpan = grabKnifeBtn.querySelector('span');
        if (knifeSpan) knifeSpan.textContent = 'Grab the Knife 🔪';
        grabKnifeBtn.classList.remove('knife-grabbed');

        // Reset avatar fed states
        avatarCards.forEach(card => {
            card.classList.remove('fed');
            const badge = card.querySelector('.feed-status-badge');
            if (badge) {
                badge.textContent = 'Not Fed ❌';
                badge.classList.remove('fed-badge');
            }
        });

        stopMicDetection();

        // Reset self-eat button
        if (selfEatBtn) {
            selfEatBtn.textContent = 'taste the handmade cake by Krish 🍰';
            selfEatBtn.disabled = false;
        }

        // Clear any override on popup action button onclick
        popupActionBtn.onclick = null;
    }

    // Helper: stop microphone / blow detection
    function stopMicDetection() {
        if (blowDetectInterval) { clearInterval(blowDetectInterval); blowDetectInterval = null; }
        if (blowFrameId) { cancelAnimationFrame(blowFrameId); blowFrameId = null; }
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }
        if (blowAudioCtx) {
            blowAudioCtx.close().catch(() => {});
            blowAudioCtx = null;
            blowAnalyser = null;
        }
        if (blowLevelBar) blowLevelBar.style.width = '0%';
    }

    // Helper: blow out candles one by one + start audio
    function blowOutCandles() {
        // 🎵 Play hbd audio when candles blow out
        if (cakeAudio) {
            cakeAudio.currentTime = 0;
            cakeAudio.loop = true;
            cakeAudio.play().catch(err => console.log('Cake audio play failed:', err));
        }

        const flames = Array.from(candleFlames);
        flames.forEach((flame, i) => {
            setTimeout(() => {
                flame.classList.remove('lit');
                flame.classList.add('blown');
                const smoke = flame.nextElementSibling; // .candle-smoke
                if (smoke) smoke.classList.add('active');
                // Heart burst for each candle
                const candle = flame.closest('.candle');
                if (candle) {
                    const rect = candle.getBoundingClientRect();
                    createHeartBurst(rect.left + rect.width / 2, rect.top, 6);
                }
            }, i * 200);
        });
    }

    // Helper: show knife + cut stage
    function showCuttingStage() {
        cakeCeremonyStage = 'cutting';
        cakePopup.classList.add('hidden');
        selfieCamBox.classList.add('hidden'); // ensure hidden

        // Reveal knife container (below cake)
        cakeKnifeBox.classList.remove('hidden');
    }

    // Helper: show feeding stage
    function showFeedingStage() {
        cakeCeremonyStage = 'feeding';
        cakeKnifeBox.classList.add('hidden');
        feedingContainer.classList.remove('hidden');
        // Big heart burst on cake cut completion
        const cakeRect = birthdayCake ? birthdayCake.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0 };
        createHeartBurst(cakeRect.left + cakeRect.width / 2, cakeRect.top + 80, 30);
    }

    // === Entry point: Called directly from card click handler ===

    function onCakeCeremonyEnter() {
        // Only run setup if we are in idle state (fresh entry)
        if (cakeCeremonyStage !== 'idle') return;

        cakeCeremonyStage = 'lighting';

        // Pause background synth only — audio plays when candles blow
        if (isSynthPlaying) {
            stopSynth();
            wasSynthBeforeCake = true;
        } else {
            wasSynthBeforeCake = false;
        }

        // Hide popup initially, candles need to light first
        cakePopup.classList.add('hidden');

        // Candles already lit in HTML; add entry flicker animation
        candleFlames.forEach((f, i) => {
            f.classList.add('lit');
            f.classList.remove('blown');
        });

        // Brief delay then show popup
        setTimeout(() => {
            cakeCeremonyStage = 'blowing';
            cakePopup.classList.remove('hidden');
        }, 1200);
    }

    // (Cake subpage back button and cleanup is handled by handleNavigation)

    // === Popup Action Button: Start blowing detection ===
    if (popupActionBtn) {
        popupActionBtn.addEventListener('click', async () => {
            popupActionBtn.classList.add('hidden');
            popupTitle.textContent = 'Open the camera & blow! 💨';
            popupDesc.textContent = 'Detecting your blow... take a deep breath and blow out the candles!';

            // Show selfie cam
            selfieCamBox.classList.remove('hidden');

            try {
                // Request microphone + camera
                micStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                cakeWebcam.srcObject = micStream;

                // Set up AnalyserNode for volume detection
                blowAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = blowAudioCtx.createMediaStreamSource(micStream);
                blowAnalyser = blowAudioCtx.createAnalyser();
                blowAnalyser.fftSize = 256;
                source.connect(blowAnalyser);

                const dataArray = new Uint8Array(blowAnalyser.frequencyBinCount);
                let candlesLeft = 5;
                let blowDetected = false;

                // Show fallback button after 8 seconds in case mic doesn't work well
                const fallbackTimer = setTimeout(() => {
                    fallbackBlowBtn.classList.remove('hidden');
                }, 8000);

                function detectBlow() {
                    if (!blowAnalyser) return;
                    blowAnalyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;

                    // Update visual bar
                    const pct = Math.min(100, (avg / 128) * 100 * 2.5);
                    if (blowLevelBar) blowLevelBar.style.width = pct + '%';

                    // Threshold for "blowing" detected (avg volume > ~30)
                    if (avg > 28 && !blowDetected) {
                        blowDetected = true;
                        clearTimeout(fallbackTimer);

                        // Hide camera immediately
                        selfieCamBox.classList.add('hidden');
                        stopMicDetection();

                        // Extinguish candles (audio starts inside here)
                        blowOutCandles();

                        // Show cutting stage after candles finish blowing
                        setTimeout(() => {
                            showCuttingStage();
                        }, 1500);
                        return; // Stop detecting
                    }

                    blowFrameId = requestAnimationFrame(detectBlow);
                }

                detectBlow();

            } catch (err) {
                console.warn('Camera/Mic access denied or unavailable:', err);
                // Show fallback if permissions denied
                popupDesc.textContent = 'Camera not available. Use the button below to blow! 💨';
                fallbackBlowBtn.classList.remove('hidden');
            }
        });
    }

    // === Fallback Blow Button (no camera scenario) ===
    if (fallbackBlowBtn) {
        fallbackBlowBtn.addEventListener('click', () => {
            fallbackBlowBtn.classList.add('hidden');
            selfieCamBox.classList.add('hidden');
            stopMicDetection();
            blowOutCandles(); // audio starts inside
            popupActionBtn.classList.add('hidden');
            setTimeout(() => showCuttingStage(), 1500);
        });
    }

    // === Grab Knife Button ===
    if (grabKnifeBtn) {
        grabKnifeBtn.addEventListener('click', () => {
            if (!knifeGrabbed) {
                knifeGrabbed = true;
                const span = grabKnifeBtn.querySelector('span');
                if (span) span.textContent = 'Knife Ready! Click Cake to Cut 🎂🔪';
                grabKnifeBtn.classList.add('knife-grabbed');
                birthdayCake.style.cursor = 'crosshair';
            }
        });
    }

    // === Click on Cake to Cut ===
    if (birthdayCake) {
        birthdayCake.addEventListener('click', () => {
            if (cakeCeremonyStage !== 'cutting' || !knifeGrabbed || cakeCutDone) return;

            cakeCutDone = true;
            // Show cut line animation
            if (cakeCutLine) cakeCutLine.classList.add('active');

            // Big confetti burst
            createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 50);

            // Hide knife container
            cakeKnifeBox.classList.add('hidden');
            birthdayCake.style.cursor = '';

            // Go straight to feeding — no lingering popup
            setTimeout(() => {
                showFeedingStage();
            }, 600);
        });
    }

    // === Feeding Avatar Cards ===
    avatarCards.forEach(card => {
        card.addEventListener('click', () => {
            if (cakeCeremonyStage !== 'feeding') return;
            if (card.classList.contains('fed')) return;

            card.classList.add('fed');
            const badge = card.querySelector('.feed-status-badge');
            if (badge) {
                badge.textContent = 'Fed ✅';
                badge.classList.add('fed-badge');
            }

            // Animate flying cake slice towards avatar
            if (flyingSlice) {
                const cardRect = card.getBoundingClientRect();
                flyingSlice.style.left = (window.innerWidth / 2) + 'px';
                flyingSlice.style.top  = (window.innerHeight / 2) + 'px';
                flyingSlice.classList.remove('hidden');
                flyingSlice.style.transition = 'left 0.6s cubic-bezier(0.4,0,0.2,1), top 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.6s';
                flyingSlice.style.opacity = '1';

                requestAnimationFrame(() => {
                    flyingSlice.style.left = (cardRect.left + cardRect.width / 2 - 20) + 'px';
                    flyingSlice.style.top  = (cardRect.top  + cardRect.height / 2 - 20) + 'px';
                });

                setTimeout(() => {
                    flyingSlice.style.opacity = '0';
                    setTimeout(() => flyingSlice.classList.add('hidden'), 300);
                }, 650);
            }

            // Heart burst at avatar position
            const rect = card.getBoundingClientRect();
            createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);

            fedCount++;
            if (fedCount >= 3) {
                // All three fed — show self eat button
                setTimeout(() => {
                    selfEatContainer.classList.remove('hidden');
                }, 700);
            }
        });
    });

    // === Self Eat Button ===
    if (selfEatBtn) {
        selfEatBtn.addEventListener('click', () => {
            cakeCeremonyStage = 'done';

            // Big burst & "Yum!" message
            createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 60);

            selfEatBtn.textContent = '😋 Yummy! Returning to Dashboard in 3s... ❤️';
            selfEatBtn.disabled = true;

            // Show return popup with redirect info
            cakePopup.classList.remove('hidden');
            popupTitle.textContent = '🎉 Ceremony Complete! 🎉';
            popupDesc.textContent = 'You celebrated Shristy\'s 18th birthday with all your loved ones! Returning to dashboard...';
            popupActionBtn.classList.add('hidden'); // Hide the button

            // Auto-redirect to dashboard in 3 seconds
            setTimeout(() => {
                window.location.hash = 'dashboard';
            }, 3000);
        });
    }

    // === Initialize candles to lit when subpage first loads ===
    // (They are already `lit` in HTML, this ensures animations play correctly)
    candleFlames.forEach(f => f.classList.add('lit'));

});

