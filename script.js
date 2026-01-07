const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let w=0,h=0,stars=[];
function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight;stars=[];for(let i=0;i<120;i++){stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+0.2,v:Math.random()*0.4+0.05,phase:Math.random()*Math.PI*2})}}
function update(){ctx.clearRect(0,0,w,h);for(let s of stars){s.y-=s.v; s.phase+=0.01; if(s.y<0) s.y=h; const glow = Math.sin(s.phase)*0.6+0.8; ctx.beginPath(); ctx.fillStyle = `rgba(174,255,255,${0.06*glow})`; ctx.arc(s.x,s.y,s.r*4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.fillStyle = `rgba(166,240,255,${0.9*glow})`; ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill()}requestAnimationFrame(update)}
window.addEventListener('resize',resize);resize();update();

// Dock interactions
// Dock interactions: 显示对应卡片，隐藏其他卡片
const panels = document.querySelectorAll('.card-panel');
function showPanel(id){
	panels.forEach(p=>{
		if(p.id === id){
			p.classList.add('visible');
			// ensure inner glass has no extra padding when card-panel provides it
			const g = p.querySelector('.glass'); if(g) g.style.transform = '';
		} else {
			p.classList.remove('visible');
		}
	});
}

document.querySelectorAll('.dock-item').forEach(btn=>{
	btn.addEventListener('click',e=>{
		document.querySelectorAll('.dock-item').forEach(b=>b.classList.remove('active'));
		btn.classList.add('active');
		const target = btn.dataset.target || 'hero';
		showPanel(target);
	});
});

// subtle parallax on mouse (applies to visible glass only)
document.addEventListener('mousemove',e=>{
	const x=(e.clientX/window.innerWidth-0.5)*18;
	const y=(e.clientY/window.innerHeight-0.5)*18;
	document.querySelectorAll('.card-panel.visible .glass').forEach(el=>el.style.transform=`translate(${x}px,${y}px)`);
});

// 加载配置文件（友链 + 菜单栏背景设置）
async function loadConfig(){
	// 1. 处理友链
	const container = document.getElementById('friend-list');
	try{
		const res = await fetch('./config.json');
		if(!res.ok) throw new Error('failed to load config.json');
		const data = await res.json();
		
		if(container && data.friends){
			container.innerHTML = '';
			data.friends.forEach(f=>{
				const a = document.createElement('a');
				a.className = 'friend-card';
				a.href = f.url || '#';
				a.target = '_blank';

				const av = document.createElement('div');
				av.className = 'avatar';
				if(f.avatar){
					const img = document.createElement('img');
					img.src = f.avatar;
					img.alt = f.name || '';
					img.style.width = '100%';
					img.style.height = '100%';
					img.style.objectFit = 'cover';
					img.style.borderRadius = '8px';
					av.appendChild(img);
				} else {
					av.textContent = (f.name||'友人').slice(0,2).toUpperCase();
				}

				const meta = document.createElement('div');
				meta.className = 'meta';
				const h = document.createElement('h3'); h.textContent = f.name || '匿名';
				const p = document.createElement('p'); p.textContent = f.desc || '';
				const u = document.createElement('a'); u.href = f.url||'#'; u.textContent = f.url ? new URL(f.url).host : '';

				meta.appendChild(h); if(p.textContent) meta.appendChild(p); if(u.textContent) meta.appendChild(u);
				a.appendChild(av); a.appendChild(meta);
				container.appendChild(a);
			});
		}

		// 3. 处理项目列表
		const projContainer = document.getElementById('project-list');
		if(projContainer && data.projects){
			projContainer.innerHTML = '';
				data.projects.forEach(p => {
					const a = document.createElement('a');
					a.className = 'project-card';
					a.href = p.url || '#';
					a.target = '_blank';

					const meta = document.createElement('div');
					meta.className = 'project-meta';
					
					const h = document.createElement('h3'); h.textContent = p.name || '项目';
					const d = document.createElement('p'); d.textContent = p.desc || '';
					
					meta.appendChild(h); 
					if(d.textContent) meta.appendChild(d);

					const lang = document.createElement('div');
					lang.className = 'project-lang';
					lang.textContent = p.language || '';

					a.appendChild(meta);
					if(lang.textContent) a.appendChild(lang);
					projContainer.appendChild(a);
				});
		}

		// 2. 处理背景图 (原菜单栏背景改为全页背景)
		if(data.background){
			setupBackground(data.background);
		} else if(data.topbar){
			// 兼容旧配置
			setupBackground(data.topbar);
		}

	}catch(err){
		if(container) container.innerHTML = '<div style="color:#f88">无法加载配置 (config.json)</div>';
		console.warn(err);
	}
}

function setupBackground(cfg){
	const bgEl = document.getElementById('page-bg');
	const topbar = document.querySelector('.topbar');
	if(!bgEl) return;

	const loadImg = () => {
		// Use larger resolution for full page
		let baseUrl = cfg.apiUrl || 'https://picsum.photos/1920/1080';
		// If the config url was small (from old config), try to bump it up if it's picsum
		if(baseUrl.includes('picsum.photos') && baseUrl.includes('/800/200')){
			baseUrl = baseUrl.replace('/800/200', '/1920/1080');
		}

		let url = baseUrl;
		if(cfg.enableRandom){
			const separator = url.includes('?') ? '&' : '?';
			url = `${url}${separator}t=${Date.now()}`;
		}
		
		const img = new Image();
		img.onload = () => {
			// fade out current bg then swap to new one for smooth transition
			try{ bgEl.style.opacity = '0'; }catch(e){}
			setTimeout(()=>{
				bgEl.style.backgroundImage = `url(${url})`;
				// ensure repaint then fade in
				requestAnimationFrame(()=>{ bgEl.style.opacity = '1'; });
			}, 120);
		};
		// start with transparent if not visible yet
		if(!bgEl.style.opacity) bgEl.style.opacity = '0';
		img.src = url;
	};

	loadImg();

	// Double click on topbar to refresh the PAGE background
	if(cfg.dblClickRefresh && topbar){
		topbar.addEventListener('dblclick', (e) => {
			if(e.target.closest('.dock-item')) return; 
			loadImg();
		});
	}
}

loadConfig();

// --- hash routing: 支持 /#hero /#about /#friends /#contact 等直接打开对应卡片 ---
function showPanel(id){
	const panels = document.querySelectorAll('.card-panel');
	panels.forEach(p=>{
		if(p.id === id){
			p.classList.add('visible');
		} else {
			p.classList.remove('visible');
		}
	});
	// update active dock
	document.querySelectorAll('.dock-item').forEach(b=>{
		if(b.dataset.target === id) b.classList.add('active'); else b.classList.remove('active');
	});
}

function handleHash(){
	const hash = location.hash.replace('#','');
	if(hash){
		showPanel(hash);
	} else {
		showPanel('hero');
	}
}

window.addEventListener('hashchange',handleHash);
// initialize from hash on load
window.addEventListener('load',()=>{
	// add small share links to each panel
	document.querySelectorAll('.card-panel').forEach(p=>{
		if(!p.id) return;
		const a = document.createElement('a');
		a.className = 'section-link';
		a.href = `#${p.id}`;
		a.title = '分享该区域链接';
		a.textContent = '🔗';
		p.style.position = 'relative';
		p.appendChild(a);
	});

	// 绑定左上角复制当前页面链接按钮
	const copyBtn = document.getElementById('copy-link');
	if(copyBtn){
		copyBtn.addEventListener('click', async (e)=>{
			e.preventDefault();
			const url = location.href;
			let ok = false;
			if(navigator.clipboard && navigator.clipboard.writeText){
				try{
					await navigator.clipboard.writeText(url);
					ok = true;
				}catch(err){ ok = false; }
			}
			if(!ok){
				const ta = document.createElement('textarea');
				ta.value = url;
				ta.style.position = 'fixed'; ta.style.left = '-9999px';
				document.body.appendChild(ta);
				ta.select();
				try{ ok = document.execCommand('copy'); }catch(e){ ok = false; }
				document.body.removeChild(ta);
			}

			const original = copyBtn.innerHTML;
			if(ok){
				copyBtn.classList.add('copied');
				copyBtn.innerHTML = '✓';
				setTimeout(()=>{ copyBtn.classList.remove('copied'); copyBtn.innerHTML = original; }, 1400);
			} else {
				copyBtn.style.opacity = '0.6';
				setTimeout(()=>{ copyBtn.style.opacity = ''; }, 1200);
			}
		});
	}

	handleHash();

		// start typing effect for intro
		try{ setupTyping(); }catch(e){/* noop */}
});

// 打字机效果（循环）- 优化版
function setupTyping(){
	const el = document.querySelector('.intro-inner');
	if(!el) return;
	
	const initial = el.getAttribute('data-initial') || el.textContent.trim();
	if(!el.getAttribute('data-initial')) el.setAttribute('data-initial', initial);

	const phrases = [
		initial,
		'一名学生 / 技术爱好者',
		'热爱编程与模拟飞行',
		'欢迎来到我的个人主页'
	];
	
	let loopNum = 0;
	let isDeleting = true; // Start phase: delete the initial text after delay
	let txt = initial;
	
	el.textContent = txt;
	el.classList.add('typing');

	function tick(){
		const i = loopNum % phrases.length;
		const fullTxt = phrases[i];

		if(isDeleting){
			txt = fullTxt.substring(0, txt.length - 1);
		} else {
			txt = fullTxt.substring(0, txt.length + 1);
		}

		el.textContent = txt;

		// 动态速度
		let delta = 120 - Math.random() * 60; 
		if(isDeleting) delta /= 2.5; 

		if(!isDeleting && txt === fullTxt){
			// Finished typing
			delta = 2000;
			isDeleting = true;
		} else if(isDeleting && txt === ''){
			// Finished deleting
			isDeleting = false;
			loopNum++;
			delta = 500;
		}

		setTimeout(tick, delta);
	}
	
	// 页面加载后等待 2 秒再开始删除
	setTimeout(tick, 2000);
}

// change dock clicks to update hash (which triggers showPanel)
document.querySelectorAll('.dock-item').forEach(btn=>{
	btn.addEventListener('click',e=>{
		const target = btn.dataset.target || 'hero';
		if(location.hash.replace('#','') !== target) location.hash = target; else showPanel(target);
	});
});

// --- 仅为简介启用滑动控件（当内容溢出时启用） ---
function setupIntroSlider(){
	const intro = document.querySelector('.intro');
	if(!intro) return;
	const inner = intro.querySelector('.intro-inner');
	const prev = intro.querySelector('.intro-prev');
	const next = intro.querySelector('.intro-next');
	function update(){
		if(inner.scrollWidth > inner.clientWidth + 2){
			intro.classList.add('scrollable');
		} else {
			intro.classList.remove('scrollable');
		}
	}
	// attach handlers
	next.addEventListener('click',()=>{ inner.scrollBy({left: Math.min(200, inner.scrollWidth), behavior:'smooth'}); });
	prev.addEventListener('click',()=>{ inner.scrollBy({left: -200, behavior:'smooth'}); });
	// on resize check
	window.addEventListener('resize',update);
	// also check after fonts/images load
	setTimeout(update,120);
}

setupIntroSlider();

// 鼠标滚轮切换卡片（支持内部滚动优先）
(function(){
	let last = 0; const THROTTLE = 800; // 增加防抖时间，避免误触
	window.addEventListener('wheel', function(e){
		const panels = Array.from(document.querySelectorAll('.card-panel'));
		const currentIndex = panels.findIndex(p=>p.classList.contains('visible'));
		if(currentIndex === -1) return;

		const currentPanel = panels[currentIndex];
		const delta = e.deltaY;

		// 检查当前面板内部滚动状态
		// isScrollable: 内容高度 > 容器可见高度
		const isScrollable = currentPanel.scrollHeight > currentPanel.clientHeight + 2;
		
		// 判定边界
		// atBottom: 滚动条接近底部
		const atBottom = Math.ceil(currentPanel.scrollTop + currentPanel.clientHeight) >= currentPanel.scrollHeight - 2;
		// atTop: 滚动条接近顶部
		const atTop = currentPanel.scrollTop <= 2;

		let shouldSwitch = false;

		if(delta > 0){ 
			// 滚轮向下
			// 如果不可滚动，或者已经到底部，则切换下一张
			if(!isScrollable || atBottom){
				shouldSwitch = true;
			}
		} else if(delta < 0){
			// 滚轮向上
			// 如果不可滚动，或者已经到顶部，则切换上一张
			if(!isScrollable || atTop){
				shouldSwitch = true;
			}
		}

		if(shouldSwitch){
			// 执行翻页逻辑，需要阻止默认滚动
			e.preventDefault();
			
			const now = Date.now(); 
			if(now - last < THROTTLE) return; 
			last = now;
			
			if(delta > 0){ // down -> next
				const next = Math.min(panels.length - 1, currentIndex + 1);
				if(next !== currentIndex) {
					const id = panels[next].id; if(id) location.hash = id; else showPanel(panels[next].id);
				}
			} else if(delta < 0){ // up -> prev
				const prev = Math.max(0, currentIndex - 1);
				if(prev !== currentIndex){ 
					const id = panels[prev].id; if(id) location.hash = id; else showPanel(panels[prev].id); 
				}
			}
		} else {
			// 允许内部滚动，不调用 preventDefault
			// 此时浏览器会处理 div 内部的 scrolling
		}
	}, {passive:false});
})();
// (已将背景图逻辑移至 loadConfig)

