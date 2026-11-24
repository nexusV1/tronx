  /* ---------- perfil (se guarda solo en este teléfono, dentro de los ajustes) ---------- */
    var PF_COLORS = ["linear-gradient(140deg,#ff7ab0,#c4246b)", "linear-gradient(140deg,#8f7bff,#4b2fd6)", "linear-gradient(140deg,#4fd1c5,#0d8a82)", "linear-gradient(140deg,#ffb35c,#e0601a)", "linear-gradient(140deg,#6fb1ff,#1f5fd6)", "linear-gradient(140deg,#4a4e7a,#17183b)"];
  var PF_COVERS = ["linear-gradient(135deg,#c4246b,#7c4dff 60%,#2b6cff)", "linear-gradient(135deg,#0d8a82,#2b6cff)", "linear-gradient(135deg,#e0601a,#c4246b)", "linear-gradient(135deg,#17183b,#4b2fd6)"];
  var PF_EMOJIS = ["😀", "😎", "🥳", "🤓", "😺", "🦊", "🐼", "🦉", "🐙", "🦄", "🌙", "⭐", "🚀", "🌿", "🌸", "🔥", "☕", "🎧", "📚", "🎨", "⚡", "🌈", "🍀", "💡"];
  function getProfile() {
    var p = settings.profile && typeof settings.profile === "object" ? settings.profile : {};
    var photo = typeof p.photo === "string" && p.photo.indexOf("data:image/") === 0 && p.photo.length < 400000 ? p.photo : "";
    var av = String(p.avatar || ""), emo = av.slice(0, 2) === "e:" ? cleanIcon(av) : "";
    var mode = av === "p" && photo ? "p" : emo ? "e" : "i";
    var ci = Math.round(Number(p.color)), vi = Math.round(Number(p.cover));
    return {
      name: String(p.name || "").replace(/\s+/g, " ").trim().slice(0, 24),
      bio: String(p.bio || "").replace(/\s+/g, " ").trim().slice(0, 60),
      mode: mode, emoji: emo, photo: photo,
      color: ci >= 0 && ci < PF_COLORS.length ? ci : 0, cover: vi >= 0 && vi < PF_COVERS.length ? vi : 0
    };
  }
  function setProfile(patch) {
    var o = settings.profile && typeof settings.profile === "object" ? settings.profile : {}, g = getProfile();
    var p = { name: o.name != null ? String(o.name).slice(0, 24) : g.name, bio: g.bio, color: g.color, cover: g.cover, photo: g.photo, avatar: g.mode === "p" ? "p" : g.mode === "e" ? g.emoji : "i" };
    if (patch.name != null) p.name = String(patch.name).slice(0, 24);
    if (patch.bio != null) p.bio = String(patch.bio).slice(0, 60);
    if (patch.color != null) p.color = patch.color;
    if (patch.cover != null) p.cover = patch.cover;
    if (patch.photo != null) p.photo = patch.photo;
    if (patch.avatar != null) p.avatar = patch.avatar;
    settings.profile = p; saveSettings();
  }
  function pfInitials(name) {
    var w = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!w.length) return "E";
    return (w[0].charAt(0) + (w.length > 1 ? w[1].charAt(0) : "")).toUpperCase();
  }
  function paintAvatar(box, p) {
    box.textContent = ""; box.style.background = "";
    if (p.mode === "p") { var im = el("img"); im.alt = ""; im.src = p.photo; box.appendChild(im); return; }
    box.style.background = PF_COLORS[p.color];
    if (p.mode === "e") { var ic = iconSpan(p.emoji, "pf"); if (ic) { box.appendChild(ic); return; } }
    var s = el("span", "pf-ini"); s.textContent = pfInitials(p.name); box.appendChild(s);
  }

  /* ---------- marcos de perfil ---------- */
  var FR_LIST = [];
  function frPt(r, a) { a = a * Math.PI / 180; return [80 + r * Math.cos(a), 80 + r * Math.sin(a)]; }
  function frP(a) { return a.map(function (n) { return n.toFixed(1); }).join(" "); }
  function frSpark(x, y, r, c, d) { return '<path class="tw" style="animation-delay:' + d + 's" d="M' + x + " " + (y - r) + "L" + (x + r * 0.22) + " " + (y - r * 0.22) + " " + (x + r) + " " + y + " " + (x + r * 0.22) + " " + (y + r * 0.22) + " " + x + " " + (y + r) + " " + (x - r * 0.22) + " " + (y + r * 0.22) + " " + (x - r) + " " + y + " " + (x - r * 0.22) + " " + (y - r * 0.22) + 'Z" fill="' + c + '"/>'; }
  FR_LIST.push({id:'neon',n:'Neón pulsante',r:'Raro',p:400,c:'#5fd4ff',f:function(){return ['','<g class="hue"><circle class="np" cx="80" cy="80" r="54" stroke="#ff3df2" stroke-width="7" filter="url(#bl)"/><circle cx="80" cy="80" r="54" stroke="#3de8ff" stroke-width="3"/><circle cx="80" cy="80" r="54" stroke="#fff" stroke-width="1" stroke-opacity=".8"/></g>']}});
  FR_LIST.push({id:'aurora',n:'Aurora',r:'Épico',p:1000,c:'#b48cff',f:function(){function arc(c,len,sp,rev,w,bl){return '<circle cx="80" cy="80" r="55" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" pathLength="100" stroke-dasharray="'+len+' '+(100-len)+'" class="'+(rev?'spinr':'spin')+'" style="animation-duration:'+sp+'s"'+(bl?' filter="url(#bl)"':'')+'/>'}var s=arc('#34f5c5',38,7,0,8,1)+arc('#7c5cff',34,10,1,8,1)+arc('#3aa8ff',30,13,0,8,1)+arc('#34f5c5',38,7,0,3)+arc('#a98bff',34,10,1,3)+arc('#6fc4ff',30,13,0,3);return ['','<g transform="rotate(-90 80 80)">'+s+'</g>']}});
  FR_LIST.push({id:'cons',n:'Constelación',r:'Épico',p:1000,c:'#b48cff',f:function(){var pts=[[-100,62],[-62,55],[-22,64],[20,57],[58,66],[98,56],[140,63],[176,57],[212,65]],d='',s='';pts.forEach(function(q,i){var p=frPt(q[1],q[0]);d+=(i?'L':'M')+frP(p)});var defs='<defs><linearGradient id="cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe3ff"/><stop offset="1" stop-color="#c3a8ff"/></linearGradient></defs>';s+='<circle cx="80" cy="80" r="56" stroke="#8fb0ff" stroke-opacity=".22" stroke-width="10" filter="url(#bl)"/><circle cx="80" cy="80" r="56" stroke="#a9b8ff" stroke-opacity=".3" stroke-width=".8"/>';s+='<path class="cdl" pathLength="100" d="'+d+'" stroke="url(#cl)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="100" filter="url(#bl2)" opacity=".8"/><path class="cdl" pathLength="100" d="'+d+'" stroke="#e6f6ff" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="100"/>';pts.forEach(function(q,i){var p=frPt(q[1],q[0]),r=3.2+(i%3)*1.5;s+=frSpark(p[0],p[1],r*1.5,'#fff',i*.35)});[[20,48],[75,70],[130,44],[200,72],[250,52],[300,70]].forEach(function(q,i){var p=frPt(q[1],q[0]);s+='<circle class="tw" style="animation-delay:'+(i*.5)+'s" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r=".9" fill="#d6e6ff"/>'});return ['',defs+'<g class="spin" style="animation-duration:70s">'+s+'</g>']}});
  FR_LIST.push({id:'sol',n:'Sol',r:'Mítico I',p:3000,c:'#ff6bd6',f:function(){
 var d='<defs><filter id="tb" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="4" result="n"><animate attributeName="baseFrequency" dur="7s" values=".045;.07;.045" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="13" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="tb2" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="9" result="n"><animate attributeName="baseFrequency" dur="5s" values=".08;.12;.08" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>'
 +'<linearGradient id="sl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#ffa21f"/></linearGradient>'
 +'<linearGradient id="sp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3b1f"/><stop offset=".55" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ffe3a0"/></linearGradient>'
 +'<linearGradient id="sr" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".6" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff3b1f" stop-opacity="0"/></linearGradient></defs>';
 var s='<circle cx="80" cy="80" r="60" stroke="#ff4a1a" stroke-width="22" stroke-opacity=".35" filter="url(#bl)" class="np"/><circle cx="80" cy="80" r="56" stroke="#ffa21f" stroke-width="12" stroke-opacity=".45" filter="url(#bl)"/>';
 // serpentinas coronales suaves (desenfocadas, largas)
 var st='';for(var i=0;i<14;i++){var L=18+(i*11%20),w=3.5+(i%3);st+='<g transform="rotate('+(i*25.7)+' 80 80)"><path class="fl2" style="animation-delay:'+(i*.37%2.2)+'s;transform-origin:80px 30px" d="M'+(80-w)+' 30L80 '+(29-L)+'L'+(80+w)+' 30Z" fill="url(#sr)"/></g>'}
 s+='<g class="spin" style="animation-duration:80s" filter="url(#bl2)">'+st+'</g>';
 // protuberancias magneticas: bucles grandes con 3 capas
 var arcs=[[-112,-66,40],[-40,-14,28],[22,70,44],[100,128,30],[150,196,40],[226,256,30]],pr='';
 arcs.forEach(function(q,i){var A=frPt(53,q[0]),B=frPt(53,q[1]),m=(q[0]+q[1])/2,C=frPt(53+q[2]*1.9,m),dd='M'+frP(A)+'Q'+frP(C)+' '+frP(B),dl='animation-delay:'+(i*1.15)+'s';
  pr+='<g class="sway" style="animation-delay:'+(i*.7)+'s"><path class="pl" style="'+dl+'" pathLength="100" d="'+dd+'" stroke="#ff3b1f" stroke-width="10" stroke-opacity=".6" filter="url(#bl2)" stroke-dasharray="100" stroke-dashoffset="100"/><path class="pl" style="'+dl+'" pathLength="100" d="'+dd+'" stroke="url(#sp)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="100"/><path class="pl" style="'+dl+'" pathLength="100" d="'+dd+'" stroke="#fff3c4" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="100"/></g>'});
 s+='<g class="spinr" style="animation-duration:120s">'+pr+'</g>';
 // fotosfera: plasma que hierve
 s+='<circle cx="80" cy="80" r="54" stroke="#ff7a1a" stroke-width="13" filter="url(#tb)"/><circle cx="80" cy="80" r="52.5" stroke="url(#sl)" stroke-width="6" filter="url(#tb2)"/><circle cx="80" cy="80" r="50.6" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/>';
 var em='';[[-100,0],[-40,.9],[30,1.7],[100,.4],[165,1.3],[235,2.1],[290,.6]].forEach(function(e){var p=frPt(60,e[0]);em+='<circle class="em2" style="animation-delay:'+e[1]+'s;--dx:'+((p[0]-80)*.45).toFixed(1)+'px;--dy:'+((p[1]-80)*.45).toFixed(1)+'px" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="1.8" fill="#ffe08a"/>'});
 return ['',d+s+em]}});
  FR_LIST.push({id:'neb',n:'Nebulosa cósmica',r:'Mítico VI',p:10000,c:'#ff6bd6',f:function(){
 var R=[[72,22,-24,'#ff9bf0',8,0],[67,19,32,'#8fd0ff',11,0]];
 function ring(k){var r=R[k],e='<ellipse cx="80" cy="80" rx="'+r[0]+'" ry="'+r[1]+'" transform="rotate('+r[2]+' 80 80)"',g=e+' stroke="'+r[3]+'" stroke-width="1.3" stroke-opacity=".5"/>';[[34,.22,1.2],[22,.4,1.6],[12,.7,2.1],[5,1,2.8]].forEach(function(t){var T=r[4];g+=e+' pathLength="100" class="run" style="animation-duration:'+T+'s;animation-delay:'+(t[0]*T/100-T).toFixed(2)+'s" stroke="#fff" stroke-opacity="'+t[1]+'" stroke-width="'+t[2]+'" stroke-dasharray="'+t[0]+' '+(100-t[0])+'" stroke-linecap="round"/>'});return g}
 var d='<defs><filter id="nt" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="7" result="n"><animate attributeName="baseFrequency" dur="14s" values=".035;.055;.035" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="2"/></filter><linearGradient id="ir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe6ff"/><stop offset=".35" stop-color="#b98bff"/><stop offset=".7" stop-color="#8fd0ff"/><stop offset="1" stop-color="#ffb0f2"/></linearGradient><clipPath id="n0"><rect transform="rotate(-24 80 80)" x="-20" y="80" width="200" height="90"/></clipPath><clipPath id="n1"><rect transform="rotate(32 80 80)" x="-20" y="80" width="200" height="90"/></clipPath></defs>';
 var cl='<g class="spin" style="animation-duration:30s"><circle cx="80" cy="80" r="57" pathLength="100" stroke="#7a2dff" stroke-width="15" stroke-opacity=".75" stroke-dasharray="46 54" filter="url(#nt)"/><circle cx="80" cy="80" r="57" pathLength="100" stroke="#ff4fd8" stroke-width="11" stroke-opacity=".7" stroke-dasharray="30 70" stroke-dashoffset="-48" filter="url(#nt)"/><circle cx="80" cy="80" r="58" pathLength="100" stroke="#3a8bff" stroke-width="10" stroke-opacity=".65" stroke-dasharray="26 74" stroke-dashoffset="-80" filter="url(#nt)"/></g><g class="spin" style="animation-duration:44s"><circle cx="80" cy="80" r="62" pathLength="100" stroke="#cfe9ff" stroke-width="4" stroke-opacity=".5" stroke-dasharray="10 90" filter="url(#bl2)"/></g>';
 var dust='';for(var i=0;i<44;i++){var a=i*8.2+(i*37%9),r=60+(i*7%15),p=frPt(r,a),rr=.55+(i%4)*.25;dust+='<circle '+(i%5==0?'class="tw" style="animation-delay:'+(i*.23%2.4)+'s" ':'')+'cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+rr+'" fill="'+(i%3?'#ffffff':'#ffc8f4')+'" opacity=".85"/>'}
 cl+='<g class="spin" style="animation-duration:110s">'+dust+'</g>';
 var st='';[[80,6,7,0],[152,82,5,.9],[80,154,6.5,1.7],[8,80,5,.4],[132,24,4,1.3],[28,132,4,2.1]].forEach(function(q){st+=frSpark(q[0],q[1],q[2],'#fff',q[3])});
 var front='<circle cx="80" cy="80" r="52" stroke="#e7b8ff" stroke-opacity=".5" stroke-width="7" filter="url(#bl2)"/><g class="hue" style="animation-duration:14s"><circle cx="80" cy="80" r="52.4" stroke="url(#ir)" stroke-width="3.6"/></g><circle cx="80" cy="80" r="54.4" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/><circle cx="80" cy="80" r="50.4" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><circle class="pw" cx="80" cy="80" r="53" stroke="#f1c9ff" stroke-width="1.6"/><circle class="pw" style="animation-delay:2.6s" cx="80" cy="80" r="53" stroke="#a9d8ff" stroke-width="1.2"/><g clip-path="url(#n0)">'+ring(0)+'</g><g clip-path="url(#n1)">'+ring(1)+'</g>'+'<circle cx="80" cy="80" r="49" stroke="#1a0a3d" stroke-opacity=".45" stroke-width="3"/>'+st+'<circle class="np" cx="80" cy="27.4" r="6" fill="#ffd9ff" opacity=".5" filter="url(#bl2)"/><path d="M80 21L82.6 25.2 87 27.4 82.6 29.6 80 34 77.4 29.6 73 27.4 77.4 25.2Z" fill="#fff"/>'+'';
 return [d+cl+ring(0)+ring(1),front]}});
  FR_LIST.push({id:'gta6',n:'GTA VI',r:'Exclusivo',p:6666666,c:'#ff4fa3',evt:'gta',tag:'VI',f:function(){
 var R=Math.PI/180;
 function arc(r,a0,a1){var p=frPt(r,a0),q=frPt(r,a1);return 'M'+frP(p)+'A'+r+' '+r+' 0 '+((a1-a0)>180?1:0)+' 1 '+frP(q)}
 function hx(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
 function pal(st,t){t=Math.max(0,Math.min(1,t));for(var i=1;i<st.length;i++){if(t<=st[i][0]){var a=st[i-1],b=st[i],u=(t-a[0])/(b[0]-a[0]),c=hx(a[1]),e=hx(b[1]);return 'rgb('+Math.round(c[0]+(e[0]-c[0])*u)+','+Math.round(c[1]+(e[1]-c[1])*u)+','+Math.round(c[2]+(e[2]-c[2])*u)+')'}}return st[st.length-1][1]}
 var GOLD=[[0,'#4a230e'],[.3,'#b8742a'],[.55,'#ffc857'],[.8,'#fff0b8'],[1,'#ffffff']];
 var VIO=[[0,'#1f0a45'],[.35,'#6a2cc0'],[.6,'#e24fb8'],[.85,'#ffb0e0'],[1,'#ffffff']];
 function metal(r,w,n,st,ph){var o='';for(var k=0;k<n;k++){var a0=-90+k*360/n,a1=a0+360/n,am=(a0+a1)/2,t=(Math.cos((am-225)*R)+1)/2;t=t*.8+((k+ph)%2?.04:0);o+='<path d="'+arc(r,a0-.4,a1+.4)+'" stroke="'+pal(st,t)+'" stroke-width="'+w+'"/>'}return o}
 var d='<defs>'
 +'<linearGradient id="gv" gradientUnits="userSpaceOnUse" x1="14" y1="20" x2="146" y2="140"><stop offset="0" stop-color="#ff2e93"/><stop offset=".5" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ffd25a"/></linearGradient>'
 +'<linearGradient id="gw" gradientUnits="userSpaceOnUse" x1="146" y1="20" x2="14" y2="140"><stop offset="0" stop-color="#8a4cff"/><stop offset=".5" stop-color="#ff2e93"/><stop offset="1" stop-color="#ff9a3d"/></linearGradient>'
 +'<linearGradient id="gn" gradientUnits="userSpaceOnUse" x1="14" y1="80" x2="146" y2="80"><stop offset="0" stop-color="#ff2e93"/><stop offset=".5" stop-color="#a24cff"/><stop offset="1" stop-color="#ff2e93"/></linearGradient>'
 +'<linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c2"/><stop offset=".35" stop-color="#ffc857"/><stop offset=".7" stop-color="#b8742a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>'
 +'<linearGradient id="gj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd0f0"/><stop offset=".45" stop-color="#ff2e93"/><stop offset="1" stop-color="#6a1ab8"/></linearGradient>'
 +'<linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1670"/><stop offset="1" stop-color="#12051f"/></linearGradient>'
 +'<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2e93"/></linearGradient>'
 +'<linearGradient id="gm" gradientUnits="userSpaceOnUse" x1="0" y1="-8.5" x2="0" y2="8.5"><stop offset="0" stop-color="#fffbe6"/><stop offset=".3" stop-color="#ffe08a"/><stop offset=".49" stop-color="#ffb43a"/><stop offset=".51" stop-color="#6a2a10"/><stop offset=".64" stop-color="#c8761e"/><stop offset=".86" stop-color="#ffd25a"/><stop offset="1" stop-color="#fff1b8"/></linearGradient>'
 +'<linearGradient id="gt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4fa3"/><stop offset=".18" stop-color="#3a1668"/><stop offset=".7" stop-color="#1b0a38"/><stop offset="1" stop-color="#0d0420"/></linearGradient>'
 +'<linearGradient id="gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b0a38"/><stop offset=".55" stop-color="#5a24a8"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient>'
 +'<clipPath id="gxo"><path clip-rule="evenodd" d="M-60 -60H220V220H-60ZM80 28.6A51.4 51.4 0 1 0 80.01 28.6Z"/></clipPath><clipPath id="gsun"><rect x="40" y="110" width="80" height="31"/></clipPath>'
 +'<clipPath id="gvi"><path d="M-16 -8L-9.4 -8L-4.6 3.4L.2 -8L6.8 -8L-2.2 8L-7 8Z"/><rect x="9" y="-8" width="6.4" height="16"/></clipPath></defs>';
 var back=d+'<circle cx="80" cy="80" r="58" stroke="#0e0420" stroke-width="17"/><circle class="np" cx="80" cy="80" r="58" stroke="url(#gw)" stroke-width="12" stroke-opacity=".6" filter="url(#bl)" style="animation-duration:3.6s"/>';
 var ring='<circle cx="80" cy="80" r="58.4" stroke="#12051f" stroke-width="5"/>'
 +metal(58.4,3.4,120,GOLD,0)
 +'<circle cx="80" cy="80" r="60.3" stroke="#fff2b0" stroke-opacity=".9" stroke-width=".7"/><circle cx="80" cy="80" r="61" stroke="#12051f" stroke-width=".9"/>'
 +'<circle cx="80" cy="80" r="55.6" stroke="#12051f" stroke-width="2.4"/>'
 +'<circle class="np" cx="80" cy="80" r="55.6" stroke="url(#gn)" stroke-width=".9" style="animation-duration:3s"/>'
 +'<circle cx="80" cy="80" r="55.6" stroke="#fff" stroke-opacity=".35" stroke-width=".3"/>'
 +metal(53,3.2,84,VIO,1)
 +'<circle cx="80" cy="80" r="51.1" stroke="#ffd25a" stroke-width=".9"/><circle cx="80" cy="80" r="50.6" stroke="#12051f" stroke-width=".8"/>';
 // detalles de neón turquesa en el canal
 var nz='';[-45,45,135,225].forEach(function(a){nz+='<path d="'+arc(55.6,a-5,a+5)+'" stroke="#3ff2e0" stroke-width="1.5" stroke-linecap="round" filter="url(#bl2)" opacity=".8"/><path d="'+arc(55.6,a-5,a+5)+'" stroke="#d8fff9" stroke-width=".7" stroke-linecap="round"/>'});
 // gemas facetadas
 function gem(x,y,s,c){return '<path d="M'+x+' '+(y-s)+'L'+(x+s*.8)+' '+y+'L'+x+' '+(y+s)+'L'+(x-s*.8)+' '+y+'Z" fill="'+c+'" stroke="#fff2b0" stroke-width=".6" stroke-linejoin="round"/><path d="M'+x+' '+(y-s)+'L'+(x+s*.8)+' '+y+'L'+x+' '+y+'Z" fill="#fff" fill-opacity=".45"/>'}
 var gems='';[[-135,'#ff2e93'],[-45,'#a24cff'],[-112,'#3ff2e0'],[-68,'#ff8ac8']].forEach(function(q,i){var p=frPt(58.4,q[0]);gems+='<g class="tw" style="animation-delay:'+(i*.6)+'s">'+gem(p[0],p[1],3,q[1])+'</g>'});
 // cresta superior
 var crest='<path d="M71 21Q60 12 50 18Q61 17 69 25Z" fill="url(#gg)" stroke="#12051f" stroke-width=".7" stroke-linejoin="round"/><path d="M89 21Q100 12 110 18Q99 17 91 25Z" fill="url(#gg)" stroke="#12051f" stroke-width=".7" stroke-linejoin="round"/>'
 +'<path d="M80 6.6L89 15L85 23L80 26.4L75 23L71 15Z" fill="url(#gg)" stroke="#12051f" stroke-width=".9" stroke-linejoin="round"/><path d="M80 9.6L86 15.4L83 21.4L80 23.6L77 21.4L74 15.4Z" fill="url(#gj)" stroke="#fff2b0" stroke-width=".5" stroke-linejoin="round"/><path d="M80 9.6L86 15.4L80 16Z" fill="#fff" fill-opacity=".5"/>'
 +'<circle class="np" cx="80" cy="28.6" r="1.1" fill="#3ff2e0" style="animation-duration:2.2s"/>';
 var glint='<circle class="spin" cx="80" cy="80" r="58.4" pathLength="100" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="6 94" style="animation-duration:6s" filter="url(#bl2)"/><circle class="spin" cx="80" cy="80" r="58.4" pathLength="100" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="6 94" style="animation-duration:6s"/><circle class="spinr" cx="80" cy="80" r="53" pathLength="100" stroke="#ffd0f0" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 47" style="animation-duration:9s"/>';
 var gl='<path d="'+arc(60.3,200,262)+'" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round" fill="none" filter="url(#bl2)"/><path d="'+arc(53,206,250)+'" stroke="#fff" stroke-opacity=".55" stroke-width=".7" stroke-linecap="round" fill="none"/>';
 // palmeras
 function bez(t,P0,C,P1){var u=1-t;return [u*u*P0[0]+2*u*t*C[0]+t*t*P1[0],u*u*P0[1]+2*u*t*C[1]+t*t*P1[1]]}
 function frond(a,L){var r=a*R,c=Math.cos(r),sn=Math.sin(r),tx=L*c,ty=L*sn+L*.42,mx=L*.55*c,my=L*.55*sn-L*.28,w=L*.19;
  var b='<path d="M0 0Q'+(mx-sn*w).toFixed(1)+' '+(my+c*w).toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+'Q'+(mx+sn*w).toFixed(1)+' '+(my-c*w+3).toFixed(1)+' 0 0Z" fill="url(#gf)" stroke="#ff7ac0" stroke-width=".35" stroke-linejoin="round"/>';
  var rib='M0 0Q'+mx.toFixed(1)+' '+(my+1).toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1),tk='';
  for(var q=1;q<=6;q++){var t=q/7.2,p=bez(t,[0,0],[mx,my+1],[tx,ty]),dx=2*(1-t)*mx+2*t*(tx-mx),dy=2*(1-t)*(my+1)+2*t*(ty-my-1),dl=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/dl,ny=dx/dl,ll=(1-t*.55)*w*.9;
   tk+='M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+'L'+(p[0]+nx*ll+dx/dl*ll*.5).toFixed(1)+' '+(p[1]+ny*ll+dy/dl*ll*.5).toFixed(1)+'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+'L'+(p[0]-nx*ll+dx/dl*ll*.5).toFixed(1)+' '+(p[1]-ny*ll+dy/dl*ll*.5).toFixed(1)}
  return b+'<path d="'+rib+'" stroke="#ffd25a" stroke-opacity=".75" stroke-width=".45"/><path d="'+tk+'" stroke="#ff9ccf" stroke-opacity=".5" stroke-width=".3"/>'}
 function palm(x,y,h,lean,sc,dly,flip,kw){kw=kw||1;
  var tx=lean,ty=-h,tr='M'+(-3.4*kw)+' 0C'+(-2.2*kw)+' '+(-h*.35)+' '+(tx*.4)+' '+(-h*.7)+' '+(tx-.9*kw)+' '+ty+'L'+(tx+1.6*kw)+' '+ty+'C'+(tx*.5+1.8*kw)+' '+(-h*.7)+' '+(2.2*kw)+' '+(-h*.35)+' '+(3.6*kw)+' 0Z';
  var fr='';[[-176,21],[-150,25],[-122,22],[-92,17],[-62,22],[-34,25],[-6,21],[20,17],[162,17]].forEach(function(q){fr+=frond(q[0],q[1]*sc)});
  var rings='';for(var k=1;k<9;k++){var yy=-h*k/9,xx=tx*(k/9)*(k/9)*.9;rings+='M'+(xx-2*kw)+' '+yy.toFixed(1)+'Q'+xx.toFixed(1)+' '+(yy+1.2).toFixed(1)+' '+(xx+2.2*kw)+' '+yy.toFixed(1)}
  var nuts='<circle cx="-1.6" cy="2.2" r="1.7" fill="#8a4a1a" stroke="#ffd25a" stroke-width=".35"/><circle cx="1.8" cy="2.6" r="1.6" fill="#7a3a14" stroke="#ffd25a" stroke-width=".35"/><circle cx="-.4" cy="3.6" r="1.5" fill="#9a5a22" stroke="#ffd25a" stroke-width=".35"/>';
  return '<g transform="translate('+x+' '+y+') scale('+(flip?-1:1)+' 1)"><g class="fr-gp" style="transform-origin:0px 0px;animation-delay:'+dly+'s"><path d="'+tr+'" fill="url(#gt)" stroke="#ff4fa3" stroke-opacity=".6" stroke-width=".4"/><path d="'+rings+'" stroke="#ff7ac0" stroke-opacity=".5" stroke-width=".4"/><g transform="translate('+tx+' '+ty+')"><ellipse cx="0" cy="2" rx="13" ry="9" fill="#ff2e93" opacity=".35" filter="url(#bl)"/>'+fr+nuts+'<circle class="tw" style="animation-delay:'+dly+'s" cx="'+(2*sc)+'" cy="-3" r=".9" fill="#fff"/></g></g></g>'}
 function flower(x,y,s,c){var o='<g transform="translate('+x+' '+y+') scale('+s+')">';for(var k=0;k<5;k++)o+='<ellipse cx="0" cy="-2.2" rx="1.5" ry="2.3" transform="rotate('+(k*72)+')" fill="'+c+'" stroke="#ffd0e6" stroke-width=".3"/>';return o+'<circle r="1" fill="#ffd25a"/></g>'}
 function leaves(x,y,fl){var o='<g transform="translate('+x+' '+y+') scale('+(fl?-1:1)+' 1)" fill="url(#gf)" stroke="#ff7ac0" stroke-width=".3">';[[-160,9],[-130,11],[-20,8]].forEach(function(q){var r=q[0]*R,L=q[1];o+='<path d="M0 0Q'+(L*.5*Math.cos(r)-1.4*Math.sin(r)).toFixed(1)+' '+(L*.5*Math.sin(r)+1.4*Math.cos(r)).toFixed(1)+' '+(L*Math.cos(r)).toFixed(1)+' '+(L*Math.sin(r)).toFixed(1)+'Q'+(L*.5*Math.cos(r)+1.4*Math.sin(r)).toFixed(1)+' '+(L*.5*Math.sin(r)-1.4*Math.cos(r)).toFixed(1)+' 0 0Z"/>'});return o+'</g>'}
 var under='<ellipse cx="22" cy="134" rx="19" ry="24" fill="#ff2e93" opacity=".3" filter="url(#bl)"/><ellipse cx="138" cy="134" rx="19" ry="24" fill="#ff9a3d" opacity=".28" filter="url(#bl)"/>';
 var palms=under+leaves(21,153,0)+leaves(139,153,1)+palm(11,142,24,-4,.57,-1.2,0,.5)+palm(24,146,34,5,.7,0,0,.62)+palm(149,142,24,-4,.57,-2.4,1,.5)+palm(136,146,34,5,.7,-.7,1,.62)+flower(17,152,.9,'#ff4fa3')+flower(143,152,.9,'#ff8a5c')+flower(33,154,.65,'#ff9ccf')+flower(127,154,.65,'#ffb070');
 // sol + placa + VI
 var stripes='';for(var k=0;k<5;k++)stripes+='<rect x="56" y="'+(128+k*3.4)+'" width="48" height="'+(.5+k*.4)+'" fill="#12051f"/>';
 var sun='<circle class="np" cx="80" cy="141" r="24" fill="#ff2e93" opacity=".5" filter="url(#bl2)" style="animation-duration:2.8s"/><circle cx="80" cy="141" r="16.5" fill="url(#gs)" clip-path="url(#gsun)"/><g clip-path="url(#gsun)">'+stripes+'</g>';
 var hexo='M42 150L49.5 139L110.5 139L118 150L110.5 161L49.5 161Z',hexi='M45.6 150L51.6 141L108.4 141L114.4 150L108.4 159L51.6 159Z';
 var plate='<path d="'+hexo+'" fill="#0e0420" stroke="#0e0420" stroke-width="2.4" stroke-linejoin="round"/><path d="'+hexo+'" fill="url(#gg)" stroke="#fff2b0" stroke-width=".6" stroke-linejoin="round"/><path d="'+hexi+'" fill="url(#gp)" stroke="#12051f" stroke-width=".8" stroke-linejoin="round"/>'
 +'<path d="M52.6 142.4L107.4 142.4" stroke="#fff" stroke-opacity=".3" stroke-width=".6"/><path class="np" d="M54 157.4L106 157.4" stroke="#ff2e93" stroke-width=".9" stroke-linecap="round" style="animation-duration:2.6s"/>'
 +'<circle class="np" cx="46.6" cy="150" r="1.5" fill="#3ff2e0" style="animation-duration:2.2s"/><circle class="np" cx="113.4" cy="150" r="1.5" fill="#3ff2e0" style="animation-duration:2.2s;animation-delay:.5s"/>';
 var VP='M-16 -8L-9.4 -8L-4.6 3.4L.2 -8L6.8 -8L-2.2 8L-7 8Z',VR='<rect x="9" y="-8" width="6.4" height="16"/>';
 var vi='<g transform="translate(80 150) skewX(-9) scale(1.02)"><g class="np" style="animation-duration:2.4s"><path d="'+VP+'" fill="none" stroke="#ff2e93" stroke-width="2.6" filter="url(#bl2)"/><rect x="9" y="-8" width="6.4" height="16" fill="none" stroke="#ff2e93" stroke-width="2.6" filter="url(#bl2)"/></g>'
  +'<g transform="translate(.9 1.2)" fill="#2a0a3a"><path d="'+VP+'" stroke="#2a0a3a" stroke-width="1.6" stroke-linejoin="round"/><rect x="9" y="-8" width="6.4" height="16" stroke="#2a0a3a" stroke-width="1.6" stroke-linejoin="round"/></g>'
  +'<path d="'+VP+'" fill="url(#gm)" stroke="#12051f" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke"/><rect x="9" y="-8" width="6.4" height="16" fill="url(#gm)" stroke="#12051f" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke"/>'
  +'<path d="'+VP+'" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".45" stroke-linejoin="round"/><rect x="9" y="-8" width="6.4" height="16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".45"/>'
  +'<g clip-path="url(#gvi)"><rect class="fr-gsw" x="-26" y="-12" width="6" height="24" fill="#fff" fill-opacity=".85" transform="skewX(-20)"/></g></g>';
 // destellos
 function flare(x,y,s,dl){return '<g class="tw" style="animation-delay:'+dl+'s"><path d="M'+(x-s)+' '+y+'L'+(x+s)+' '+y+'M'+x+' '+(y-s)+'L'+x+' '+(y+s)+'" stroke="#fff" stroke-width=".6" stroke-linecap="round"/><path d="M'+(x-s*.45)+' '+(y-s*.45)+'L'+(x+s*.45)+' '+(y+s*.45)+'M'+(x-s*.45)+' '+(y+s*.45)+'L'+(x+s*.45)+' '+(y-s*.45)+'" stroke="#ffe9a8" stroke-width=".4" stroke-linecap="round"/><circle cx="'+x+'" cy="'+y+'" r="1.4" fill="#fff"/></g>'}
 var sp=flare(37.4,37.4,6.5,0)+flare(125,52,4.2,1.1)+frSpark(14,92,2.6,'#ffd25a',.5)+frSpark(147,100,2.8,'#fff',1.6)+frSpark(104,10,2.4,'#ff9ccf',1.2)+frSpark(58,9,2,'#fff',.3);
 var front=ring+nz+gems+gl+glint+crest+'<g clip-path="url(#gxo)">'+palms+'</g>'+sun+plate+vi+sp;
 return [back,front]}});
  FR_LIST.push({id:'fus',n:'Fusión nuclear',r:'Mítico IV',p:6500,c:'#ff6bd6',fam:'nuc',tag:'Núcleo absoluto',ev:1,f:function(){
 var R=Math.PI/180;
 function pa(r,a0,a1,ccw){return 'A'+r+' '+r+' 0 0 '+(ccw?0:1)+' '}
 function arc(r,a0,a1){var p=frPt(r,a0),q=frPt(r,a1);return 'M'+frP(p)+'A'+r+' '+r+' 0 0 1 '+frP(q)}
 function ann(r0,r1,a0,a1){var p1=frPt(r0,a0),p2=frPt(r0,a1),p3=frPt(r1,a1),p4=frPt(r1,a0);return 'M'+frP(p1)+'A'+r0+' '+r0+' 0 0 1 '+frP(p2)+'L'+frP(p3)+'A'+r1+' '+r1+' 0 0 0 '+frP(p4)+'Z'}
 var d='<defs>'
 +'<linearGradient id="st" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="146" y2="150"><stop offset="0" stop-color="#c3d3ff"/><stop offset=".28" stop-color="#6a82cf"/><stop offset=".6" stop-color="#2c3b80"/><stop offset="1" stop-color="#0e1538"/></linearGradient>'
 +'<linearGradient id="s2" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="146" y2="150"><stop offset="0" stop-color="#7f98e0"/><stop offset=".4" stop-color="#26346f"/><stop offset="1" stop-color="#090e2a"/></linearGradient>'
 +'<linearGradient id="am" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb02e"/><stop offset=".5" stop-color="#fff0b0"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>'
 +'<linearGradient id="wn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#ffa91f"/><stop offset="1" stop-color="#e0650f"/></linearGradient>'
 +'<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".35" stop-color="#ffb42a"/><stop offset="1" stop-color="#d9570c"/></linearGradient>'
 +'<radialGradient id="cr" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#ffe27a"/><stop offset=".65" stop-color="#ff8a1f"/><stop offset="1" stop-color="#b04dff" stop-opacity=".7"/></radialGradient>'
 +'<radialGradient id="wh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#d9f3ff"/><stop offset="1" stop-color="#4aa8ff"/></radialGradient>'
 +'<radialGradient id="fb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffd25a"/><stop offset=".7" stop-color="#ff6a1a" stop-opacity=".8"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#7fd0ff" stop-opacity="0"/></linearGradient><radialGradient id="bs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1a2a66"/><stop offset="1" stop-color="#070b22"/></radialGradient>'
 +'<clipPath id="cg0"><rect x="4" y="63" width="16" height="34" rx="3"/></clipPath><clipPath id="cg1"><rect x="140" y="63" width="16" height="34" rx="3"/></clipPath><clipPath id="xo"><path clip-rule="evenodd" d="M-30 -30H190V190H-30ZM80 29.6A50.4 50.4 0 1 0 80.01 29.6Z"/></clipPath></defs>';
 var back=d+'<circle cx="80" cy="80" r="58.8" stroke="#04071a" stroke-width="16.5"/>'
 +'<circle class="np" cx="80" cy="80" r="58.6" stroke="#ff9a1f" stroke-width="12" stroke-opacity=".32"/>'
 +'<circle cx="80" cy="80" r="66" stroke="url(#st)" stroke-width="3.4"/><circle cx="80" cy="80" r="64.1" stroke="#04071a" stroke-width="1"/><circle cx="80" cy="80" r="67.9" stroke="#04071a" stroke-width="1"/>'
 +'<circle cx="80" cy="80" r="66" pathLength="144" stroke="#0a1030" stroke-width="1.2" stroke-dasharray=".8 3.2" stroke-opacity=".8"/>';
 var pl='';
 for(var i=0;i<12;i++){var a0=i*30+2.4,a1=i*30+27.6,am=i*30+15,
  dx=(3.2*Math.cos(am*R)).toFixed(2),dy=(3.2*Math.sin(am*R)).toFixed(2),jx=(((i*7)%5)-2)*.3,jy=(((i*5)%5)-2)*.3,
  ad=Math.abs(((am-90+540)%360)-180),w=(ad/180*.55).toFixed(2),
  base=ann(54.6,63.4,a0,a1),ins=ann(56.1,61.9,a0+3.4,a1-3.4),ob=ann(54.6,63.4,a0,a1);
  var r1=frPt(58.9,a0+5.6),r2=frPt(58.9,a1-5.6);
  var ck=[frPt(55,am-4),frPt(57.6,am+1.6),frPt(59.4,am-2),frPt(61.4,am+2.4),frPt(63,am-.4)];
  pl+='<g class="fr-xp" style="--dx:'+dx+'px;--dy:'+dy+'px;--jx:'+jx.toFixed(2)+'px;--jy:'+jy.toFixed(2)+'px">'
   +'<path d="'+base+'" fill="url(#st)" stroke="#04071a" stroke-width=".9" stroke-linejoin="round"/>'
   +'<path d="'+ins+'" fill="url(#s2)" stroke="#a9c4ff" stroke-opacity=".35" stroke-width=".5"/>'
   +'<path d="'+arc(55.3,a0+1.6,a1-1.6)+'" stroke="#e1ecff" stroke-width=".8" stroke-opacity=".75" stroke-linecap="round"/>'
   +'<path d="'+arc(62.8,a0+2.4,a1-2.4)+'" stroke="#0a1030" stroke-width=".7" stroke-opacity=".7"/>'
   +'<circle cx="'+r1[0].toFixed(1)+'" cy="'+r1[1].toFixed(1)+'" r=".95" fill="#d7e3ff" stroke="#04071a" stroke-width=".4"/><circle cx="'+r2[0].toFixed(1)+'" cy="'+r2[1].toFixed(1)+'" r=".95" fill="#d7e3ff" stroke="#04071a" stroke-width=".4"/>'
   +'<path class="fr-xcr" d="M'+ck.map(frP).join('L')+'" stroke="#ffe08a" stroke-width=".95" stroke-linejoin="round" stroke-linecap="round"/>'
   +'<path class="fr-xh" d="'+base+'" stroke="#ff7a1a" stroke-width="1.3" stroke-linejoin="round"/>'
   +'<path class="fr-xpf" style="--w:'+w+'s" d="'+base+'" fill="#d6f2ff" stroke="#fff" stroke-width=".6"/></g>';}
 // ventanas ambar
 var sl='';[45,135,225,315].forEach(function(a,i){var dd=arc(59.1,a-9,a+9);
  sl+='<path d="'+dd+'" stroke="#04071a" stroke-width="6.6" stroke-linecap="round"/><path d="'+dd+'" stroke="url(#wn)" stroke-width="4.4" stroke-linecap="round"/><path class="np" style="animation-delay:'+(i*.6)+'s" d="'+dd+'" stroke="#fff6c8" stroke-width="2" stroke-linecap="round"/><path d="'+arc(60.6,a-7,a+7)+'" stroke="#fff" stroke-opacity=".55" stroke-width=".6" stroke-linecap="round"/><path class="fr-xc" d="'+dd+'" stroke="#eaf9ff" stroke-width="4.4" stroke-linecap="round"/>'});
 var rings='<circle cx="80" cy="80" r="52.9" stroke="#04071a" stroke-width="3.4"/><circle cx="80" cy="80" r="52.9" pathLength="100" stroke="#6b3a0c" stroke-width="1.5"/><circle class="fr-xsm" cx="80" cy="80" r="52.9" stroke="#bfe8ff" stroke-width="1.5"/>'
 +'';
 var runs='<circle class="run" cx="80" cy="80" r="52.9" pathLength="100" style="animation-duration:8s" stroke="url(#am)" stroke-width="1.5" stroke-dasharray="16 34" stroke-linecap="round"/><circle class="run" cx="80" cy="80" r="66" pathLength="100" style="animation-duration:15s" stroke="#fff" stroke-width="1.1" stroke-opacity=".9" stroke-dasharray="5 95" stroke-linecap="round"/>';
 function cap(cx,cy,sd){
  var t='',gx=cx-8,gy=cy-17,gh=34,bot=gy+gh;
  [-90,30,150].forEach(function(a){var r1=2.4,r2=6.6,a0=(a-30)*R,a1=(a+30)*R;function q(r,an){return (cx+r*Math.cos(an)).toFixed(1)+' '+(cy+r*Math.sin(an)).toFixed(1)}t+='<path d="M'+q(r1,a0)+'L'+q(r2,a0)+'A'+r2+' '+r2+' 0 0 1 '+q(r2,a1)+'L'+q(r1,a1)+'A'+r1+' '+r1+' 0 0 0 '+q(r1,a0)+'Z" fill="#2a1204" fill-opacity=".72" stroke="#ffd86a" stroke-width=".35" stroke-opacity=".8"/>'});
  var bub='';[[-3.5,13,0],[2.5,15,1.1]].forEach(function(b,i){bub+='<circle class="fr-xb" style="animation-delay:'+(b[2]+sd*.4)+'s" cx="'+(cx+b[0])+'" cy="'+(cy+b[1])+'" r="'+(.8+i%2*.4)+'" fill="#fff6c8" fill-opacity=".8"/>'});
  var tk='';for(var k=1;k<5;k++){var y=(gy+gh*k/5).toFixed(1);tk+='M'+(cx+5.6)+' '+y+'H'+(cx+8)}
  return '<rect class="fr-xc" x="'+(cx-15)+'" y="'+(cy-28)+'" width="30" height="56" rx="11" fill="#ffb02e" filter="url(#bl)"/>'
  +'<rect x="'+(cx-11.5)+'" y="'+(cy-21)+'" width="23" height="42" rx="4.5" fill="#04071a" stroke="url(#st)" stroke-width="1.4"/>'
  +'<rect x="'+gx+'" y="'+gy+'" width="16" height="34" rx="3" fill="#1a0a04"/>'
  +'<g clip-path="url(#cg'+sd+')"><rect class="fr-xlq" style="transform-origin:'+cx+'px '+bot+'px" x="'+gx+'" y="'+gy+'" width="16" height="34" fill="url(#gl)"/>'
  +'<rect class="fr-xls" x="'+gx+'" y="'+(bot-gh*.4-.5)+'" width="16" height="1.3" fill="#fffbe0"/></g>'
  +'<rect class="fr-xcg" x="'+gx+'" y="'+gy+'" width="16" height="34" rx="3" fill="#fff4c0"/>'
  +bub+t+'<circle cx="'+cx+'" cy="'+cy+'" r="1.6" fill="#2a1204" fill-opacity=".8"/>'
  +'<path d="'+tk+'" stroke="#fff" stroke-opacity=".7" stroke-width=".6"/>'
  +'<rect x="'+(cx-6.4)+'" y="'+(cy-15.5)+'" width="2.2" height="31" rx="1.1" fill="#fff" fill-opacity=".5"/><rect x="'+(cx+4.6)+'" y="'+(cy-14)+'" width="1" height="28" rx=".5" fill="#fff" fill-opacity=".25"/>'
  +'<rect x="'+(cx-11)+'" y="'+(cy-26)+'" width="22" height="6.4" rx="2.2" fill="url(#st)" stroke="#04071a" stroke-width=".9"/><rect x="'+(cx-11)+'" y="'+(cy+19.6)+'" width="22" height="6.4" rx="2.2" fill="url(#s2)" stroke="#04071a" stroke-width=".9"/>'
  +'<path d="M'+(cx-9)+' '+(cy-24.6)+'H'+(cx+9)+'" stroke="#e1ecff" stroke-opacity=".7" stroke-width=".6"/>'
  +'<circle cx="'+(cx-7)+'" cy="'+(cy-22.8)+'" r=".9" fill="#d7e3ff"/><circle cx="'+(cx+7)+'" cy="'+(cy-22.8)+'" r=".9" fill="#d7e3ff"/><circle cx="'+(cx-7)+'" cy="'+(cy+22.8)+'" r=".9" fill="#d7e3ff"/><circle cx="'+(cx+7)+'" cy="'+(cy+22.8)+'" r=".9" fill="#d7e3ff"/>'
  +'<circle class="np" style="animation-delay:'+(sd*.3)+'s" cx="'+cx+'" cy="'+(cy-23)+'" r="1.4" fill="#ff5a3a"/><circle class="np" style="animation-delay:'+(sd*.3+1.1)+'s" cx="'+cx+'" cy="'+(cy+23)+'" r="1.4" fill="#4ad0ff"/>'}
 var br='';[12,148].forEach(function(cx){var s=cx<80?1:-1;br+='<path d="M'+(cx+s*11)+' '+(80-7)+'L'+(cx+s*17)+' '+(80-4)+'L'+(cx+s*17)+' '+(80+4)+'L'+(cx+s*11)+' '+(80+7)+'Z" fill="url(#s2)" stroke="#04071a" stroke-width=".8"/>'});
 // emblema atomico
 var tk='';for(var k=0;k<12;k++){var p=[80+10.2*Math.cos(k*30*R),14+10.2*Math.sin(k*30*R)],q=[80+11.6*Math.cos(k*30*R),14+11.6*Math.sin(k*30*R)];tk+='M'+frP(p)+'L'+frP(q)}
 var at='<circle cx="80" cy="14" r="14.2" fill="url(#bs)" stroke="url(#st)" stroke-width="4"/><circle cx="80" cy="14" r="12" stroke="#ffb02e" stroke-width=".9"/><circle cx="80" cy="14" r="16.4" stroke="#04071a" stroke-width=".9"/><path d="'+tk+'" stroke="#6f8fe0" stroke-width=".7"/>'
 +(function(){
  var C=[80,14],RX=10.2,RY=3.6,cols=['#9fe6ff','#ffffff','#b9c8ff'],O=[[0,2.3,9],[60,3.3,11],[120,4.5,13]];
  var defs='<defs><clipPath id="ohb"><rect x="55" y="-14" width="50" height="28"/></clipPath><clipPath id="ohf"><rect x="55" y="14" width="50" height="28"/></clipPath><radialGradient id="nb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#bfe8ff"/><stop offset="1" stop-color="#2a7bff" stop-opacity="0"/></radialGradient></defs>';
  var rot=function(r,inner){return '<g transform="rotate('+r+' 80 14)"><g class="fr-xwb" style="animation-duration:'+inner[0]+'s;animation-delay:-'+inner[1]+'s">'+inner[2]+'</g></g>'};
  function els(T,lg0,col){var o='';[[0,1.35,1],[.08,.95,.45]].forEach(function(t){var lg=lg0+t[0]*T;
    o+='<g><circle cx="80" cy="14" r="'+(t[0]==0?'1.35':t[1])+'" fill="'+(t[0]==0?'#fff':col)+'" fill-opacity="'+t[2]+'">'+(t[0]==0?'':'')+'<animateMotion class="fr-xmo" data-d="'+T+'" dur="'+T+'s" begin="-'+lg.toFixed(2)+'s" repeatCount="indefinite" path="M-10.2 0A10.2 3.6 0 1 0 10.2 0A10.2 3.6 0 1 0 -10.2 0"/></circle>'+(t[0]==0?'<circle cx="80" cy="14" r="2.6" fill="'+col+'" fill-opacity=".25"><animateMotion class="fr-xmo" data-d="'+T+'" dur="'+T+'s" begin="-'+lg.toFixed(2)+'s" repeatCount="indefinite" path="M-10.2 0A10.2 3.6 0 1 0 10.2 0A10.2 3.6 0 1 0 -10.2 0"/></circle>':'')+'</g>'});return o}
  var back='',front='';
  O.forEach(function(q,i){var T=q[1],col=cols[i],lg0=i*.9+.3;
    var ell='<ellipse cx="80" cy="14" rx="'+RX+'" ry="'+RY+'"';
    back+=rot(q[0],[q[2],i*2.1,ell+' stroke="#4aa8ff" stroke-width=".7" stroke-opacity=".5"/><g clip-path="url(#ohb)">'+els(T,lg0,col)+'</g>']);
    var fa='M'+(80-RX)+' 14A'+RX+' '+RY+' 0 0 0 '+(80+RX)+' 14';
    front+=rot(q[0],[q[2],i*2.1,'<path d="'+fa+'" stroke="#2a7bff" stroke-width="2.4" stroke-opacity=".3"/><path d="'+fa+'" stroke="#d6f4ff" stroke-width=".9" stroke-linecap="round"/><g clip-path="url(#ohf)">'+els(T,lg0,col)+'</g>']);});
  var nuc='<circle class="np" cx="80" cy="14" r="6.4" fill="#2a7bff" opacity=".35"/><circle class="fr-xnw" cx="80" cy="14" r="3" stroke="#bfe8ff" stroke-width=".5"/><circle class="fr-xnw" style="animation-delay:-1.1s" cx="80" cy="14" r="3" stroke="#8fdcff" stroke-width=".5"/><circle cx="80" cy="14" r="4.4" fill="url(#nb)" class="np" style="animation-duration:1.3s"/>'
   +'<g class="fr-xnu">'+[[-1.2,-.8,'#fff'],[1.2,-.6,'#8fdcff'],[0,-1.8,'#d6f4ff'],[-.8,1.2,'#8fdcff'],[1,1.3,'#fff']].map(function(q){return '<circle cx="'+(80+q[0])+'" cy="'+(14+q[1])+'" r="1.25" fill="'+q[2]+'"/>'}).join('')+'</g><circle cx="80" cy="14" r="1.1" fill="#fff"/>';
  return defs+back+nuc+front})()
+'<path d="M68.6 9A12 12 0 0 1 80 2" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>'
+'<circle class="fr-xc" cx="80" cy="14" r="10.5" fill="#d6f2ff"/>';
 // nucleo / reactor (camara de fusion)
 var CY=144;
 var rx='<path d="M52 152L56 146H104L108 152L104 159H56Z" fill="url(#st)" stroke="#04071a" stroke-width=".9" stroke-linejoin="round"/><path d="M57 148H103" stroke="#e1ecff" stroke-opacity=".7" stroke-width=".7"/><path d="M58 155.4H102" stroke="#04071a" stroke-width="2.4" stroke-linecap="round"/><path class="np" d="M60 155.4H100" stroke="#ffb02e" stroke-width="1.2" stroke-dasharray="5 3" stroke-linecap="round"/>'
 +'<circle cx="58" cy="151.6" r=".9" fill="#d7e3ff"/><circle cx="102" cy="151.6" r=".9" fill="#d7e3ff"/>'
 // bobinas laterales
 +'<path d="M62 146L60 138L66 136L68 146Z" fill="url(#s2)" stroke="#04071a" stroke-width=".8"/><path d="M98 146L100 138L94 136L92 146Z" fill="url(#s2)" stroke="#04071a" stroke-width=".8"/><circle class="np" cx="63" cy="136.2" r="1.7" fill="#7fd0ff"/><circle class="np" style="animation-delay:.9s" cx="97" cy="136.2" r="1.7" fill="#7fd0ff"/>'
 // domo de vidrio
 +'<circle cx="80" cy="'+CY+'" r="13.4" fill="#070b22" stroke="url(#st)" stroke-width="3"/><circle cx="80" cy="'+CY+'" r="11.7" fill="url(#bs)" stroke="#ffb02e" stroke-width=".7" stroke-opacity=".9"/>'
 +'<circle cx="80" cy="'+CY+'" r="10" fill="#ff8a1f" opacity=".3" class="np"/>'
 +'<g class="fr-xk"><clipPath id="csp"><circle cx="80" cy="'+CY+'" r="8"/></clipPath><circle cx="80" cy="'+CY+'" r="8" fill="url(#cr)"/>'
 +'<g clip-path="url(#csp)"><g class="spin" style="transform-origin:80px '+CY+'px;animation-duration:5s"><path d="M80 '+(CY-8)+'C86 '+(CY-6)+' 87 '+(CY-1)+' 80 '+CY+'C73 '+(CY+1)+' 74 '+(CY+6)+' 80 '+(CY+8)+'" stroke="#fff" stroke-opacity=".85" stroke-width="1.5"/><path d="M72 '+CY+'C74 '+(CY-6)+' 79 '+(CY-6)+' 80 '+CY+'C81 '+(CY+6)+' 86 '+(CY+6)+' 88 '+CY+'" stroke="#ffe27a" stroke-opacity=".8" stroke-width="1.1"/></g></g>'
 +'<circle cx="80" cy="'+CY+'" r="8" stroke="#fff3c0" stroke-width=".5"/></g>'
 +'<clipPath id="xoo"><path clip-rule="evenodd" d="M-30 -30H190V190H-30ZM80 29.6A50.4 50.4 0 1 0 80.01 29.6Z"/></clipPath>'
 +'<g clip-path="url(#xoo)"><g class="fr-xs"><circle cx="80" cy="'+CY+'" r="9.7" pathLength="24" stroke="#ffe9a8" stroke-width="1.3" stroke-dasharray="2 4" stroke-linecap="round"/><circle cx="80" cy="'+CY+'" r="16.4" pathLength="30" stroke="#7fd0ff" stroke-width="1.1" stroke-dasharray="5 5" stroke-linecap="round"/></g></g>'
 +'<path d="M70 137.6A12 12 0 0 1 80 132" stroke="#fff" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/><path d="M66 150A16 5.5 0 0 0 94 150" stroke="#c3d3ff" stroke-width="2" stroke-opacity=".9"/>';
 // generador de rayos (desplazamiento del punto medio + ramas)
 var sd0=7;function rnd(){sd0=(sd0*16807)%2147483647;return sd0/2147483647}
 function bolt(a0,a1,rb,amp,withBr){var pts=[[a0,rb],[a1,rb]];for(var it=0;it<3;it++){var np=[];for(var j=0;j<pts.length-1;j++){var p=pts[j],q=pts[j+1];np.push(p);np.push([(p[0]+q[0])/2,(p[1]+q[1])/2+(rnd()-.5)*amp/(it+1)])}np.push(pts[pts.length-1]);pts=np}
  var m=pts.map(function(p,j){return (j?'L':'M')+frP(frPt(Math.max(52,Math.min(66,p[1])),p[0]))}).join('');var br='';
  if(withBr){[2,5].forEach(function(k){var p=pts[k*pts.length/8|0],dir=rnd()<.5?-1:1,b=[];for(var u=1;u<=3;u++)b.push(frPt(Math.max(52,Math.min(66.5,p[1]+dir*u*2.2+(rnd()-.5)*2)),p[0]+u*(1.6+rnd()*1.4)*(rnd()<.5?-1:1)));br+='M'+frP(frPt(Math.max(52,Math.min(66,p[1])),p[0]))+'L'+b.map(frP).join('L')})}
  return m+br}
 function boltSvg(dd,w){return '<path d="'+dd+'" stroke="#2a7bff" stroke-opacity=".45" stroke-width="'+(w*3.4)+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+dd+'" stroke="#8fdcff" stroke-width="'+(w*1.5)+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+dd+'" stroke="#fff" stroke-width="'+(w*.7)+'" stroke-linecap="round" stroke-linejoin="round"/>'}
 var zz='';
 function glint(p,i){return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.2" fill="#cfeeff" opacity=".4"/><circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r=".9" fill="#fff"/><circle cx="'+(p[0]+(i%2?1.8:-1.6)).toFixed(1)+'" cy="'+(p[1]+(i%3-1)*1.4).toFixed(1)+'" r=".55" fill="#ffd25a"/>'}
 function pushBolt(A,B,d,endpts,i){
  zz+='<g class="fr-xzg" style="--d:'+d+'s"><g class="fr-xza">'+boltSvg(A,1)+'</g><g class="fr-xzb2">'+boltSvg(B,1)+'</g>'
   +'<path class="fr-xzt" d="'+A+'" pathLength="100" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="18 100"/>'
   +endpts.map(function(p){return glint(p,i)}).join('')+'</g>'}
 [[-30,-6],[186,212],[56,82],[98,126],[236,260],[278,304]].forEach(function(q,i){
  var A=bolt(q[0],q[1],58.8,9,1),B=bolt(q[0],q[1],58.8,9,1);
  pushBolt(A,B,((i*.43)%1.9).toFixed(2),[frPt(58.8,q[0]),frPt(58.8,q[1])],i)});
 // descargas cortas entre piezas metalicas (capsulas, bobinas, emblema)
 function seg(p,q,n,amp){var o='M'+frP(p);for(var j=1;j<n;j++){var t=j/n;o+='L'+frP([p[0]+(q[0]-p[0])*t+(rnd()-.5)*amp,p[1]+(q[1]-p[1])*t+(rnd()-.5)*amp])}return o+'L'+frP(q)}
 [[[23,56],[27.5,62]],[[137,56],[132.5,62]],[[64,136],[71,141]],[[96,136],[89,141]]].forEach(function(q,i){
  pushBolt(seg(q[0],q[1],4,2.6),seg(q[0],q[1],4,2.6),((i*.29+.35)%1.9).toFixed(2),[q[0],q[1]],i+3)});
 var cd='';[[180,90,0],[0,90,1]].forEach(function(q){var p=frPt(52.9,q[0]),r=frPt(52.9,q[1]),dd='M'+frP(p)+'A52.9 52.9 0 0 '+(q[2]?1:0)+' '+frP(r);
  cd+='<path class="fr-xcd" d="'+dd+'" pathLength="100" stroke="#7fd0ff" stroke-width="3.4" stroke-opacity=".7" stroke-dasharray="7 14" filter="url(#bl2)"/><path class="fr-xcd" d="'+dd+'" pathLength="100" stroke="#fff" stroke-width="1.1" stroke-dasharray="7 14"/>'});
 // tendrones desde el nucleo al estallar
 var zb='';for(var k=0;k<9;k++){var an=-175+k*21+rnd()*8,len=26+rnd()*30,pp=[[80,CY]];for(var u=1;u<=6;u++){var t=u/6,a=an*R+(rnd()-.5)*.35;pp.push([80+len*t*Math.cos(an*R)+(rnd()-.5)*5,CY+len*t*Math.sin(an*R)+(rnd()-.5)*5])}
  var dd=pp.map(function(p,j){return (j?'L':'M')+frP(p)}).join('');zb+='<g class="fr-xzb" style="--d:'+(k%3*.05).toFixed(2)+'s">'+boltSvg(dd,.95)+'</g>'}
 // rayos de luz
 var rays='';for(var k=0;k<14;k++){var an=k*(360/14)+(k%2?4:-3),ln=48+(k%3)*14,wd=1.4+(k%2)*.9;rays+='<path transform="translate(80 '+CY+') rotate('+an.toFixed(1)+')" d="M0 0L'+(-wd)+' '+(-ln)+'L'+wd+' '+(-ln)+'Z" fill="url(#rg)"/>'}
 var ex='';for(var k=0;k<18;k++){var an=(-178+k*(176/17)+((k*37)%11)-5),m=26+((k*13)%8)*8;if(k%5==4){an=(k%2?16:164);m=24+(k%4)*7}
  var a=an*R,col=k%3?'#e8f8ff':'#ffc04a',len=1.4+(k%4)*.9;
  ex+='<g class="fr-xe" style="--dx:'+(m*Math.cos(a)).toFixed(1)+'px;--dy:'+(m*Math.sin(a)).toFixed(1)+'px;animation-delay:calc(6.75s + '+(k%5*.04).toFixed(2)+'s)"><ellipse cx="80" cy="'+CY+'" rx="'+len+'" ry=".75" transform="rotate('+an.toFixed(0)+' 80 '+CY+')" fill="'+col+'"/></g>'}
 var sh='';for(var k=0;k<8;k++){var an=(-172+k*23+((k*17)%9))*R,m=32+(k*11)%30,s=1.7+(k%3)*.7;
  sh+='<g class="fr-xsh" style="--dx:'+(m*Math.cos(an)).toFixed(1)+'px;--dy:'+(m*Math.sin(an)).toFixed(1)+'px;--r:'+(220+k*70)+'deg;animation-delay:calc(6.75s + '+(k%3*.04).toFixed(2)+'s)"><path d="M'+(-s)+' '+(-s*.6)+'L'+s+' '+(-s*.3)+'L'+(s*.5)+' '+s*.9+'L'+(-s*.8)+' '+(s*.6)+'Z" fill="url(#st)" stroke="#c9dcff" stroke-width=".4" transform="translate(80 '+CY+')"/></g>'}
 var em='';for(var k=0;k<6;k++){var x=60+k*4.4+((k*7)%4),y=137+(k*3)%8;em+='<circle class="fr-xm" style="--dx:'+(((k*5)%7)-3)+'px;--dy:'+(-14-(k%3)*6)+'px;animation-delay:calc(7.4s + '+(k*.11).toFixed(2)+'s)" cx="'+x+'" cy="'+y+'" r=".8" fill="#ffb02e"/>'}
 var sk='';for(var k=0;k<5;k++){sk+='<circle class="fr-xsk" style="--dx:'+(((k*9)%15)-7)+'px;--dy:'+(-18-(k%3)*7)+'px;animation-delay:calc(7.3s + '+(k*.12).toFixed(2)+'s)" cx="'+(68+k*6)+'" cy="'+(CY+1)+'" r="5" fill="#2b3b82" filter="url(#bl)"/>'}
 var fl='<g class="fr-xl"><ellipse cx="80" cy="'+CY+'" rx="52" ry="2.8" fill="#e8f8ff" filter="url(#bl2)"/><ellipse cx="80" cy="'+CY+'" rx="3.2" ry="38" fill="#e8f8ff" filter="url(#bl2)"/><ellipse cx="80" cy="'+CY+'" rx="30" ry="1.8" fill="#fff" transform="rotate(40 80 '+CY+')"/><ellipse cx="80" cy="'+CY+'" rx="30" ry="1.8" fill="#fff" transform="rotate(-40 80 '+CY+')"/></g>';
 var bl='<g clip-path="url(#xo)"><circle class="fr-xg" cx="80" cy="80" r="58.8" stroke="#a8dcff" stroke-width="15" filter="url(#bl)"/>'+sk
  +'<circle class="fr-xfb" cx="80" cy="'+CY+'" r="15" fill="url(#fb)" filter="url(#bl2)"/><circle class="fr-xw" cx="80" cy="'+CY+'" r="26" fill="#4aa8ff" filter="url(#bl)"/><circle class="fr-xw" cx="80" cy="'+CY+'" r="12.5" fill="url(#wh)"/>'
  +'<g class="fr-xry">'+rays+'</g>'+fl
  +'<circle class="fr-xr" cx="80" cy="'+CY+'" r="8" stroke="#cfeeff" stroke-width="2.6"/><circle class="fr-xr" style="animation-delay:6.95s" cx="80" cy="'+CY+'" r="8" stroke="#ffb02e" stroke-width="1.8"/><circle class="fr-xr" style="animation-delay:7.15s" cx="80" cy="'+CY+'" r="8" stroke="#7fd0ff" stroke-width="1.2"/>'+zb+ex+sh+em+'</g>';
 var front=rings+pl+sl+br, live=cap(12,80,0)+cap(148,80,1)+at+rx, evl='<g clip-path="url(#xo)">'+cd+zz+'</g>'+bl;
 return [back,front,runs,live,evl]}});
  var FR_DEFS = '<defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter><filter id="bl2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>', frN = 0, FR_CLS = { spin: 1, spinr: 1, tw: 1, np: 1, hue: 1, run: 1, cdl: 1, fl2: 1, pl: 1, sway: 1, em2: 1, pw: 1 };
  function frById(id) { for (var i = 0; i < FR_LIST.length; i++) if (FR_LIST[i].id === id) return FR_LIST[i]; return null; }
  function frEq() { var m = settings.max; return m && m.eq && frById(m.eq.frame) ? m.eq.frame : ""; }
  function frMarkup(f) {
    var r = f.f(), u = "_" + (++frN);
    function fix(t) { return t.replace(/id="(\w+)"/g, 'id="$1' + u + '"').replace(/url\(#(\w+)\)/g, "url(#$1" + u + ")").replace(/class="([^"]+)"/g, function (a, c) { return 'class="' + c.split(" ").map(function (x) { return FR_CLS[x] ? "fr-" + x : x; }).join(" ") + '"'; }); }
    function svg(t) { return '<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">' + t + "</svg>"; }
    var o = [r[0] ? svg(fix(r[0])) : "", svg(FR_DEFS.replace(/id="(\w+)"/g, 'id="$1' + u + '"') + fix(r[1]))];
    for (var i = 2; i < r.length; i++) o.push(svg(fix(r[i])));
    return o;
  }
  /* pone el marco alrededor de un avatar: wrap es el contenedor con position:relative y av el avatar; D su diámetro */
  /* animaciones especiales de algunos marcos: ocurren al azar, muy de vez en cuando */
  var frEvT = 0, FR_EV_MS = 10500;
  function frEvRun(wrap) { var sp = wrap.querySelectorAll(".fr[data-ev]"); if (!sp.length) return; var spin = function (fast) { wrap.querySelectorAll("animateMotion.fr-xmo").forEach(function (a) { a.setAttribute("dur", fast ? "0.9s" : a.getAttribute("data-d") + "s"); }); }; sp.forEach(function (e) { e.classList.remove("ev"); }); void wrap.offsetWidth; sp.forEach(function (e) { e.classList.add("ev"); }); spin(true); setTimeout(function () { sp.forEach(function (e) { e.classList.remove("ev"); }); spin(false); }, FR_EV_MS); }
  function frEvPlan(first) {
    clearTimeout(frEvT); frEvT = 0; if (!document.querySelector(".fr[data-ev]")) return;
    var r = Math.random(), ms = first ? 20000 + Math.random() * 25000 : r < 0.2 ? 25000 + Math.random() * 35000 : r < 0.8 ? 60000 + Math.random() * 150000 : 240000 + Math.random() * 420000;
    frEvT = setTimeout(frEvFire, ms);
  }
  function frEvFire() {
    frEvT = 0;
    if (document.visibilityState === "visible" && !calmOn()) {
      var seen = [];
      document.querySelectorAll(".fr[data-ev]").forEach(function (e) { var w = e.parentNode, b = e.getBoundingClientRect(); if (seen.indexOf(w) < 0 && b.width > 0 && b.bottom > 0 && b.top < innerHeight && !(w.closest && w.closest(".mx-fc:not(.sel)"))) seen.push(w); });
      seen.forEach(frEvRun);
    }
    frEvPlan(false);
  }
  /* los marcos que no se ven en pantalla se pausan: menos trabajo y menos batería */
  var frIO = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var off = !e.isIntersecting, sv = e.target.firstChild; e.target.classList.toggle("fr-off", off); if (sv && sv.pauseAnimations) { if (off || (e.target.closest && e.target.closest(".mx-fc:not(.sel)"))) sv.pauseAnimations(); else sv.unpauseAnimations(); } });
  }, { rootMargin: "80px" }) : null;
  function frApply(wrap, av, id, D) {
    if (!wrap || !av) return;
    wrap.querySelectorAll(".fr").forEach(function (x) { if (frIO) frIO.unobserve(x); x.remove(); });
    var f = id && frById(id); if (!f) return;
    var m = frMarkup(f), sz = Math.round(D * 1.6), off = -Math.round(D * 0.3);
    function mkl(h) { var e = el("span", "fr"); if (f.ev) e.setAttribute("data-ev", "1"); e.setAttribute("aria-hidden", "true"); e.style.cssText = "width:" + sz + "px;height:" + sz + "px;left:" + off + "px;top:" + off + "px"; e.innerHTML = h; if (frIO) frIO.observe(e); return e; }
    if (m[0]) wrap.insertBefore(mkl(m[0]), av);
    var fr = mkl(m[1]); if (av.nextSibling) wrap.insertBefore(fr, av.nextSibling); else wrap.appendChild(fr);
    for (var li = 2; li < m.length; li++) { var lv = mkl(m[li]); lv.classList.add("lv"); if (fr.nextSibling) wrap.insertBefore(lv, fr.nextSibling); else wrap.appendChild(lv); fr = lv; }
    if (f.ev && !frEvT) frEvPlan(true);
  }

