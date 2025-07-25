// 动态点线连线动画背景，自动适配暗色模式
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1'; // 负值，确保container在上层
    canvas.style.pointerEvents = 'none';
    canvas.style.transition = 'background 0.3s';
    document.body.prepend(canvas);

    let ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;
    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // 物理模拟参数：引力场粒子运动
    const PARTICLE_COUNT = 36;
    const PARTICLE_RADIUS = 2.2;
    const LINK_DIST = 120;
    const TRAIL_LENGTH = 18;
    let particles = [];
    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                ax: 0,
                ay: 0,
                trail: []
            });
        }
    }
    initParticles();
    window.addEventListener('resize', initParticles);

    // 颜色自动适配主题
    function getColors() {
        const isDark = document.body.classList.contains('dark');
        return {
            bg: isDark ? '#181a1b' : '#f7f8fa',
            particle: isDark ? '#6ca0f6' : '#2a7ae2',
            link: isDark ? 'rgba(108,160,246,0.18)' : 'rgba(42,122,226,0.18)',
            trail: isDark ? 'rgba(108,160,246,0.08)' : 'rgba(42,122,226,0.08)'
        };
    }
    // 监听主题变化
    const observer = new MutationObserver(() => draw());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    function draw() {
        const { bg, particle, link, trail } = getColors();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        // 画拖尾
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = particles[i];
            ctx.save();
            ctx.globalAlpha = 0.18;
            for (let j = 1; j < p.trail.length; j++) {
                ctx.beginPath();
                ctx.strokeStyle = trail;
                ctx.moveTo(p.trail[j - 1].x, p.trail[j - 1].y);
                ctx.lineTo(p.trail[j].x, p.trail[j].y);
                ctx.stroke();
            }
            ctx.restore();
        }
        // 画连线
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = link;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
        // 画粒子
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = particle;
            ctx.shadowColor = particle;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    function tick() {
        // 物理模拟：引力场+边界反弹
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            let ax = 0, ay = 0;
            for (let j = 0; j < PARTICLE_COUNT; j++) {
                if (i === j) continue;
                const dx = particles[j].x - particles[i].x;
                const dy = particles[j].y - particles[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                if (dist < 180) {
                    // 引力/斥力混合
                    const force = (dist < 60 ? -0.12 : 0.08) / dist;
                    ax += force * dx;
                    ay += force * dy;
                }
            }
            particles[i].vx += ax * 0.5;
            particles[i].vy += ay * 0.5;
            // 阻尼
            particles[i].vx *= 0.98;
            particles[i].vy *= 0.98;
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            // 边界反弹
            if (particles[i].x < 0) { particles[i].x = 0; particles[i].vx *= -0.7; }
            if (particles[i].x > W) { particles[i].x = W; particles[i].vx *= -0.7; }
            if (particles[i].y < 0) { particles[i].y = 0; particles[i].vy *= -0.7; }
            if (particles[i].y > H) { particles[i].y = H; particles[i].vy *= -0.7; }
            // 拖尾
            particles[i].trail.push({ x: particles[i].x, y: particles[i].y });
            if (particles[i].trail.length > TRAIL_LENGTH) particles[i].trail.shift();
        }
        draw();
        requestAnimationFrame(tick);
    }
    tick();
})();
