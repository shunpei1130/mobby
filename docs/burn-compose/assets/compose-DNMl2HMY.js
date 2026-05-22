import{g as u}from"./icons-BAsau70F.js";const se={activity:["ご飯","朝ごはん","ランチ","ディナー","カフェ","散歩","買い物","ドライブ","旅行","イベント"],mood:["まったり","おしゃれ","落ち着く","ロマンチック","ワクワク","にぎやか"],scene:["初デート","休日","昼デート","夜デート","記念日","雨の日"],budget:["低予算","ふつう","ちょっと贅沢"],time:["朝","昼","夕方","夜"]},ue={activity:"デート内容",mood:"雰囲気",scene:"シーン",budget:"予算感",time:"時間帯"};Object.values(se).flat();const fe=""+new URL("./template/10-CFo8_Jfy.webp",import.meta.url).href,be=""+new URL("./template/11-CqOmunVL.webp",import.meta.url).href,xe=""+new URL("./template/2-CGZEKk5G.webp",import.meta.url).href,_e=""+new URL("./template/3-CDVqUVDH.webp",import.meta.url).href,ye=""+new URL("./template/4-BRCnF_Th.webp",import.meta.url).href,ve=""+new URL("./template/5-CaVf-1av.webp",import.meta.url).href,we=""+new URL("./template/6-CRL82_QX.webp",import.meta.url).href,Te=""+new URL("./template/7-BJux1PXH.webp",import.meta.url).href,$e=""+new URL("./template/8-Dcr7M8Ov.webp",import.meta.url).href,Se=""+new URL("./template/9-CdhuyqAb.webp",import.meta.url).href,_=1240,w=1754,Me={x:.06,y:.06,width:.88,height:.88},ke=["primary","secondary","accent","detail"],V={1:["text"],2:["text","text2"],3:["text","text2","text3"],4:["text","text2","text3","intro"],5:["text","text2","text3","intro","body"],6:["text","text2","text3","intro","body","editor"]};function S(e){return new URL(Object.assign({"../../references/template_roughs/10.webp":fe,"../../references/template_roughs/11.webp":be,"../../references/template_roughs/2.webp":xe,"../../references/template_roughs/3.webp":_e,"../../references/template_roughs/4.webp":ye,"../../references/template_roughs/5.webp":ve,"../../references/template_roughs/6.webp":we,"../../references/template_roughs/7.webp":Te,"../../references/template_roughs/8.webp":$e,"../../references/template_roughs/9.webp":Se})[`../../references/template_roughs/${e}`],import.meta.url).href}function r(e,t,a,o){return{x:e,y:t,width:a-e,height:o-t}}function Ne(e,t){const a=Math.max(e.x,t.x),o=Math.max(e.y,t.y),i=Math.min(e.x+e.width,t.x+t.width),s=Math.min(e.y+e.height,t.y+t.height);return i<=a||s<=o?null:{x:a,y:o,width:i-a,height:s-o}}function Ae(e,t){const a=Math.abs(t.x-e.x)<1e-4,o=Math.abs(t.x+t.width-(e.x+e.width))<1e-4;if(a&&!o)return"left";if(o&&!a)return"right";const i=t.x+t.width/2,s=e.x+e.width/2;return i<=s?"left":"right"}function ne(e,t=[]){return t.map(a=>{const o=Ne(e,a.rect);return o?{type:a.type,side:Ae(e,o),x:o.x,y:o.y,width:o.width,height:o.height,offsetTop:Math.max(0,o.y-e.y)}:null}).filter(Boolean)}function Ee(e){return V[e]||V[6]}function F(e,t,a){return Math.min(a,Math.max(t,e))}function q(e,t,a){if(!t||typeof t!="object")return{...e};const o=F(Number.isFinite(Number(t.width))?Number(t.width):e.width,a.width,1),i=F(Number.isFinite(Number(t.height))?Number(t.height):e.height,a.height,1);return{...e,x:F(Number.isFinite(Number(t.x))?Number(t.x):e.x,0,1-o),y:F(Number.isFinite(Number(t.y))?Number(t.y):e.y,0,1-i),width:o,height:i,align:["left","center","right"].includes(t.align)?t.align:e.align}}function Pe(e,t){if(!t||t.templateId!==e.id)return e;const a=t.images||{},o=t.texts||{};return{...e,safeArea:{...e.safeArea},masks:e.masks.map(i=>({...i,rect:{...i.rect}})),images:e.images.map(i=>q(i,a[i.key],{width:.06,height:.06})),texts:e.texts.map(i=>{const s=q(i,o[i.fieldKey],{width:.08,height:.025});return{...s,exclusions:ne(s,e.masks)}})}}const Ce={page1:{roughUrl:S("3.webp"),images:[r(.0523,.0555,.4717,.236),r(.5021,.0555,.9477,.515),r(.4724,.5385,.9477,.7195),r(.0523,.6375,.4052,.9445)],texts:[r(.0523,.264,.4717,.447),r(.0523,.4755,.4335,.612),r(.4335,.7395,.9477,.9445)]},page2:{roughUrl:S("4.webp"),images:[r(.0636,.046,.4837,.386),r(.1351,.4065,.4837,.641),r(.5191,.594,.9364,.9545)],texts:[r(.5191,.046,.9364,.5705),r(.0997,.6615,.4837,.9545)]},page3:{roughUrl:S("5.webp"),images:[r(.087,.1705,.4823,.4215),r(.087,.442,.9123,.937)],texts:[{...r(.087,.061,.9123,.1495),fieldKey:"text",singleLine:!1},r(.5141,.1705,.9123,.4215)]},page4:{roughUrl:S("6.webp"),images:[r(.1004,.1065,.4823,.4905),r(.1004,.512,.4823,.8955)],texts:[r(.5184,.1065,.8996,.4905),r(.5184,.512,.8996,.8955)],masks:[{type:"ellipse-cutout",rect:r(.3586,.39,.6414,.59)}]},page5:{roughUrl:S("7.webp"),images:[r(.0792,.1745,.4823,.929)],texts:[{...r(.0785,.071,.4823,.1385),fieldKey:"text",singleLine:!1},{...r(.5184,.071,.9215,.929),fieldKey:"body"}]},page6:{roughUrl:S("8.webp"),images:[r(.0997,.482,.4866,.756),r(.5134,.482,.9003,.756)],texts:[r(.0997,.0705,.9003,.3785),r(.0997,.3915,.9003,.469),r(.0997,.769,.4866,.9195),r(.5134,.769,.9003,.9195)]},page7:{roughUrl:S("9.webp"),images:[r(.5354,.1065,.8777,.47),r(.1004,.5295,.4427,.893)],texts:[{...r(.1011,.1065,.4427,.47),singleLine:!1},r(.5347,.5295,.8777,.893)],masks:[{type:"ellipse-cutout",rect:r(.357,.3925,.643,.6075)}]},page9:{roughUrl:S("10.webp"),images:[{...r(.0552,.2795,.4632,.9015),shape:"arch-right"}],texts:[r(.1011,.0975,.8996,.244),r(.1952,.28,.9455,.9025)]},page10:{roughUrl:S("11.webp"),images:[r(.0651,.0395,.3324,.9605),r(.3798,.294,.9349,.538)],texts:[r(.3791,.0385,.6337,.26),r(.681,.0395,.9349,.261),r(.3791,.571,.6337,.9605),r(.681,.5705,.9349,.9605)]},page11:{roughUrl:S("2.webp"),images:[r(.2313,.126,.7687,.66)],texts:[{...r(.046,.059,.2051,.105),fieldKey:"date",singleLine:!0},{...r(.1825,.6835,.8175,.7495),fieldKey:"text2",singleLine:!1},{...r(.1528,.7735,.8472,.818),fieldKey:"text3",singleLine:!1},{...r(.1528,.8415,.367,.9425),fieldKey:"intro",singleLine:!1},{...r(.3897,.8415,.604,.9425),fieldKey:"body",singleLine:!1},{...r(.633,.8415,.8472,.9425),fieldKey:"editor",singleLine:!1}]}},K=new Map;function ze(e){const t=Ce[e];if(!t)return null;const a=Ee(t.texts.length);return{id:e,roughUrl:t.roughUrl,safeArea:{...Me},masks:(t.masks||[]).map(i=>({...i,rect:{...i.rect}})),images:t.images.map((i,s)=>({key:ke[s],...i})),texts:t.texts.map((i,s)=>({fieldKey:i.fieldKey||a[s],...i,align:i.align||"left",singleLine:i.singleLine,exclusions:ne(i,t.textExclusionMasks||t.masks||[])}))}}function G(e,t=null){K.has(e)||K.set(e,ze(e));const a=K.get(e)||null;return a?Pe(a,t):null}function Le(e,t,a=1){const o=t.height*w,n={weight:600,fallbackStack:'"Cormorant Garamond", "Times New Roman", serif',size:28/1.5*.5,lineRatio:1.35},c=n.size*F(Number(a)||1,1,4),p=Math.max(c*n.lineRatio,c+4),d=c*.03,m=Math.max(1,Math.floor((o+c*.2)/p));return{fontSize:c,lineHeight:p,letterSpacing:d,maxLines:m,weight:n.weight,fallbackStack:n.fallbackStack}}function Q(e,t,a=0){const o=String(t||"");return e.measureText(o).width+Math.max(0,o.length-1)*Math.max(0,Number(a)||0)}function Be(e,t,a,o,i=0){const s=String(t||""),n=Math.max(0,Number(i)||0);if(!n||s.length<=1){e.fillText(s,a,o);return}let c=a;Array.from(s).forEach(p=>{e.fillText(p,c,o),c+=e.measureText(p).width+n})}function Fe(e,t,a,o,i=0){let s="",n=a;for(;n<t.length;){const c=`${s}${t[n]}`;if(s&&Q(e,c,i)>o||(s=c,n+=1,Q(e,s,i)>o))break}return{line:s,nextIndex:Math.max(n,a+(s?0:1))}}function He(e,t,a,o){const i=String(t||"").replace(/\r/g,"").replace(/\n+/g,""),s=Array.from(i),n=o.maxLines,c=a.x*_,p=a.y*w,d=a.width*_,m=Math.min(d*.55,d*.28+10),x=Math.max(d*.35,d-m);let T=0;for(let l=0;l<n&&T<s.length;l+=1){const g=a.fieldKey==="headline"&&l>=n-3,b=a.fieldKey==="body"&&l<3,$=Fe(e,s,T,g||b?x:d,o.letterSpacing);Be(e,$.line,c+(b?m:0),p+l*o.lineHeight,o.letterSpacing),T=$.nextIndex}}async function Oe(e,t,a,o,i){const s=G(t,a==null?void 0:a.fixedLayout);if(!s)return;const{addWrappedText:n,drawFileCover:c,drawSlotPlaceholder:p,defaults:d,getTextFontStack:m,getTextScale:x=()=>1,getTextBackgroundColor:T=()=>""}=i;e.fillStyle="#191514",e.textBaseline="top",e.textAlign="left";for(const l of s.images){const g=o==null?void 0:o[l.key],b={x:l.x*_,y:l.y*w,width:l.width*_,height:l.height*w,radius:0,shape:l.shape||"rect"};g!=null&&g.file?await c(e,g.file,b,g.position):p(e,b)}for(const l of s.texts){const g=(a==null?void 0:a[l.fieldKey])||(d==null?void 0:d[l.fieldKey])||"",b=Le(l.fieldKey,l,x(l.fieldKey)),C=T(l.fieldKey);e.save(),C&&(e.fillStyle=C,e.fillRect(l.x*_,l.y*w,l.width*_,l.height*w)),e.fillStyle="#191514",e.textAlign=l.align||"left",e.font=`${b.weight} ${Math.round(b.fontSize)}px ${m(l.fieldKey,b.fallbackStack)}`,t==="page7"&&(l.fieldKey==="headline"||l.fieldKey==="body")?He(e,g,l,b):n(e,g,{x:(l.align||"left")==="center"?(l.x+l.width/2)*_:l.x*_,y:l.y*w,maxWidth:l.width*_,lineHeight:b.lineHeight,letterSpacing:b.letterSpacing,maxLines:b.maxLines,align:l.align||"left",exclusions:(l.exclusions||[]).map($=>({x:$.x*_,y:$.y*w,width:$.width*_,height:$.height*w}))}),e.restore()}s.masks.length&&(e.save(),e.fillStyle=a.backgroundColor||"#f8f4ee",s.masks.forEach(l=>{const g={x:l.rect.x*_,y:l.rect.y*w,width:l.rect.width*_,height:l.rect.height*w};l.type==="ellipse-cutout"&&(e.beginPath(),e.ellipse(g.x+g.width/2,g.y+g.height/2,g.width/2,g.height/2,0,0,Math.PI*2),e.fill())}),e.restore())}function k(e,t,a){const o=G(e);return{id:e,label:t,description:a,roughUrl:(o==null?void 0:o.roughUrl)||"",async render(i,s,n,c){await Oe(i,e,s,n,c)}}}const re=k("page1","Page 1","Template 1"),Ue=k("page2","Page 2","Template 2"),Ke=k("page3","Page 3","Template 3"),Ie=k("page4","Page 4","Template 4"),Re=k("page5","Page 5","Template 5"),De=k("page6","Page 6","Template 6"),Ge=k("page7","Page 7","Template 7"),M={x:.06,y:.06,width:.88,height:.88},ee=.015,te={densityMode:"whitespace",recoveryMode:"restore"},je={width:.14,height:.12},Xe={width:.18,height:.08},Ye={primary:{x:.08,y:.16,width:.4,height:.3},secondary:{x:.58,y:.12,width:.24,height:.2},accent:{x:.56,y:.58,width:.26,height:.18}},We={headline:{x:.08,y:.07,width:.46,height:.1,fontSize:.056,lineHeight:1.08,align:"left",family:"serif",weight:600},subhead:{x:.08,y:.16,width:.48,height:.07,fontSize:.023,lineHeight:1.34,align:"left",family:"sans",weight:500},intro:{x:.08,y:.52,width:.28,height:.18,fontSize:.021,lineHeight:1.42,align:"left",family:"sans",weight:500},body:{x:.62,y:.42,width:.22,height:.24,fontSize:.021,lineHeight:1.42,align:"left",family:"sans",weight:500},date:{x:.08,y:.91,width:.22,height:.04,fontSize:.019,lineHeight:1.25,align:"left",family:"sans",weight:500},editor:{x:.66,y:.91,width:.2,height:.04,fontSize:.019,lineHeight:1.25,align:"right",family:"sans",weight:500}},Je=[{id:"image-1",x:.1,y:.14,width:.38,height:.34}];function E(e,t,a){return Math.min(a,Math.max(t,e))}function H(e){return Math.round(e/ee)*ee}function le(e,t,a){return typeof t=="string"&&t.trim()?t.trim():`${e}-${a+1}`}function j(e,t=""){return String(e??t).replace(/\r/g,"")}function ce(e,t){const a=E(H(Number.isFinite(e.width)?e.width:t.width),t.width,M.width),o=E(H(Number.isFinite(e.height)?e.height:t.height),t.height,M.height);return{x:E(H(Number.isFinite(e.x)?e.x:M.x),M.x,M.x+M.width-a),y:E(H(Number.isFinite(e.y)?e.y:M.y),M.y,M.y+M.height-o),width:a,height:o}}function I(e={},t=0){return{id:le("image",e.id,t),...ce(e,je)}}function D(e={},t=0){const a=typeof e.text=="string",o=e.kind==="title"||e.kind==="body"?e.kind:(Number(e.fontSize)||0)>=.04||e.family==="serif"?"title":"body";return{id:le("text",e.id,t),kind:o,text:j(e.text,"text"),isDefaultText:typeof e.isDefaultText=="boolean"?e.isDefaultText:!a,...ce(e,Xe),fontSize:E(Number.isFinite(e.fontSize)?e.fontSize:.028,.014,.09),lineHeight:E(Number.isFinite(e.lineHeight)?e.lineHeight:1.35,1,2.2),padding:E(Number.isFinite(e.padding)?e.padding:.012,.004,.05),align:e.align==="center"||e.align==="right"?e.align:"left",family:e.family==="serif"?"serif":"sans",weight:E(Number.isFinite(e.weight)?e.weight:e.family==="serif"?600:500,400,700)}}function Ze(e={}){return Object.entries(We).map(([t,a],o)=>D({id:`text-${o+1}`,text:j(e[t],""),x:a.x,y:a.y,width:a.width,height:a.height,fontSize:a.fontSize,lineHeight:a.lineHeight,padding:a.family==="serif"?.01:.012,align:a.align,kind:a.family==="serif"&&a.fontSize>=.04?"title":"body",family:a.family,weight:a.weight},o)).filter(t=>t.text.trim())}function Ve(e={}){return{densityMode:e.densityMode==="fill"?"fill":te.densityMode,recoveryMode:e.recoveryMode==="keep"?"keep":te.recoveryMode}}function qe(e={}){return Array.isArray(e.imageBoxes)&&e.imageBoxes.length?e.imageBoxes.map((t,a)=>I(t,a)):e.imageBoxes&&typeof e.imageBoxes=="object"?Object.entries(Ye).map(([t,a],o)=>{var s;const i=((s=e.imageBoxes)==null?void 0:s[t])||{};return I({id:t,x:Number.isFinite(i.x)?i.x:a.x,y:Number.isFinite(i.y)?i.y:a.y,width:Number.isFinite(i.width)?i.width:a.width,height:Number.isFinite(i.height)?i.height:a.height},o)}):Je.map((t,a)=>I(t,a))}function Qe(e={},t={}){if(Array.isArray(e.textBoxes)&&e.textBoxes.length)return e.textBoxes.map((i,s)=>D(i,s));const a=!!(e.imageBoxes&&!Array.isArray(e.imageBoxes)&&typeof e.imageBoxes=="object"),o=Ze(t);return a&&o.length?o:[D({id:"text-1",text:j(t.headline,"text"),isDefaultText:!t.headline,x:.56,y:.18,width:.24,height:.14,kind:"title",fontSize:.046,lineHeight:1.12,padding:.01,family:"serif",weight:600},0)]}function et(e={},t={}){return{options:Ve(e),imageBoxes:qe(e),textBoxes:Qe(e,t)}}function Mt(e){return{left:`${e.x*100}%`,top:`${e.y*100}%`,width:`${e.width*100}%`,height:`${e.height*100}%`}}function ae(e,t){return{x:e.x+e.width*t.x,y:e.y+e.height*t.y,width:e.width*t.width,height:e.height*t.height,radius:0}}function kt(e){return H(e)}const tt={id:"page8",label:"Page 8",description:"Custom free layout",async render(e,t,a,o){var m,x,T,l,g,b,C,$,Y,W,J,Z;const{addWrappedText:i,drawFileCover:s}=o,n={x:84,y:84,width:1072,height:1586},c=et(t.customLayout||{},t),p=Array.isArray((m=t.customLayout)==null?void 0:m.pretextBoxes)?t.customLayout.pretextBoxes:null;e.fillStyle="#191514",e.textBaseline="top";const d=o.page8Files||{};if(((x=t.customLayout)==null?void 0:x.editorType)==="pretext"&&p){for(const h of p){const v={x:n.x+h.x/794*n.width,y:n.y+h.y/1123*n.height,width:h.width/794*n.width,height:h.height/1123*n.height,radius:0};if(h.kind==="image"){(T=h.data)!=null&&T.src&&await s(e,h.data.src,v,{cropX:Number(h.data.cropX)||0,cropY:Number(h.data.cropY)||0,zoom:Math.max(1,Number(h.data.zoom)||1)});continue}const P=Math.max(0,Number((l=h.data)==null?void 0:l.padding)||0),L=Math.max(12,Number((g=h.data)==null?void 0:g.lineHeight)||34);e.textAlign=((b=h.data)==null?void 0:b.align)||"left",e.fillStyle=((C=h.data)==null?void 0:C.color)||"#191514",e.font=`${Number(($=h.data)==null?void 0:$.fontWeight)||400} ${Math.max(12,Number((Y=h.data)==null?void 0:Y.fontSize)||22)}px ${((W=h.data)==null?void 0:W.fontFamily)||'"Noto Sans JP", sans-serif'}`;const B=e.textAlign==="right"?v.x+v.width-P:e.textAlign==="center"?v.x+v.width/2:v.x+P;i(e,((J=h.data)==null?void 0:J.text)||"",{x:B,y:v.y+P,maxWidth:Math.max(24,v.width-P*2),lineHeight:L,maxLines:Math.max(1,Math.floor(Math.max(L,v.height-P*2)/L))})}return}for(const f of c.imageBoxes){const y=ae(n,f);(Z=d[f.id])!=null&&Z.file&&await s(e,d[f.id].file,y,d[f.id].position)}c.textBoxes.forEach(f=>{const y=ae(n,f),h=Math.max(0,n.width*(f.padding||0)),v=f.family==="serif"?'"Cormorant Garamond", "Times New Roman", serif':'"Noto Sans JP", sans-serif';e.textAlign=f.align,e.font=`${f.weight} ${Math.round(n.width*f.fontSize)}px ${v}`;const P=f.align==="right"?y.x+y.width-h:f.align==="center"?y.x+y.width/2:y.x+h,L=Math.max(24,y.width-h*2),B=n.width*f.fontSize*f.lineHeight,ge=Math.max(B,y.height-h*2);i(e,f.text||"",{x:P,y:y.y+h,maxWidth:L,lineHeight:B,maxLines:Math.max(1,Math.floor(ge/Math.max(12,B)))})})}},at=k("page9","Page 9","Template 9"),ot=k("page10","Page 10","Template 10"),it=k("page11","Page 11","Template 11"),de=[re,Ue,Ke,Ie,Re,De,Ge,at,ot,it,tt],z=re.id,oe=new Map(de.map(e=>[e.id,e]));function Nt(e){return oe.get(e)||oe.get(z)}const pe=[{value:"",label:"None"},{value:"#ffffff",label:"White"},{value:"#f8f4ee",label:"Ivory"},{value:"#f4e5de",label:"Blush"},{value:"#ece4d8",label:"Sand"},{value:"#e5ece7",label:"Sage"},{value:"#e8e5df",label:"Gray"}],st=new Set(pe.map(e=>e.value).filter(Boolean)),nt=de.filter(e=>e.id!=="page8"&&e.id!=="page9"),rt=[{label:"ショートテキスト用",options:[{id:"noto-serif-jp",label:"Noto Serif JP"},{id:"noto-sans-jp",label:"Noto Sans JP"},{id:"source-han-serif",label:"Source Han Serif"},{id:"klee-one",label:"Klee One"},{id:"zen-kaku-gothic-new",label:"Zen Kaku Gothic New"},{id:"biz-udgothic",label:"BIZ UDGothic"},{id:"kosugi-maru",label:"Kosugi Maru"},{id:"line-seed-jp",label:"LINE Seed JP"}]},{label:"タイトル用",options:[{id:"kaisei-tokumin",label:"Kaisei Tokumin"},{id:"sawarabi-mincho",label:"Sawarabi Mincho"},{id:"hina-mincho",label:"Hina Mincho"},{id:"shippori-mincho",label:"Shippori Mincho"},{id:"zen-old-mincho",label:"Zen Old Mincho"}]}],R={"kaisei-tokumin":"'Kaisei Tokumin', 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif","noto-serif-jp":"'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif","noto-sans-jp":"'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif","zen-kaku-gothic-new":"'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif","biz-udgothic":"'BIZ UDGothic', 'Yu Gothic', sans-serif","kosugi-maru":"'Kosugi Maru', 'Hiragino Maru Gothic ProN', sans-serif","klee-one":"'Klee One', 'Klee', 'Noto Serif JP', 'Hiragino Mincho ProN', serif","line-seed-jp":"'LINE Seed JP', 'Noto Sans JP', 'Hiragino Sans', sans-serif","sawarabi-mincho":"'Sawarabi Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif","hina-mincho":"'Hina Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif","source-han-serif":"'Source Han Serif', 'Source Han Serif JP', 'Noto Serif JP', serif","shippori-mincho":"'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif","zen-old-mincho":"'Zen Old Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif","editorial-serif":"'Zen Old Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif","modern-sans":"'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif","soft-serif":"'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif"};function lt(e=z){return e==="page8"?"custom":"template"}function N(e={},t){const a=(e==null?void 0:e[t])||{},o=Number.isFinite(Number(a.scale))?Math.min(2,Math.max(.5,Number(a.scale))):1,i=st.has(String(a.backgroundColor||"").toLowerCase())?String(a.backgroundColor).toLowerCase():"",s=i?`background-color:${i};`:"",n=i?` data-compose-text-background-color="${i}"`:"";return`style="--compose-text-scale:${o};${s}"${n}`}function ct(e){const t=Number(e);return Number.isFinite(t)?Math.min(2,Math.max(.5,t)):null}function ie(e){return["left","center","right"].includes(e)?e:null}function dt(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function pt(e=""){if(!e||typeof document>"u")return"";const t=document.createElement("template");t.innerHTML=String(e);const a=document.createElement("div"),o=(i,s)=>{if(i.nodeType===Node.TEXT_NODE){s.append(document.createTextNode(i.textContent||""));return}if(i.nodeType!==Node.ELEMENT_NODE)return;const n=i;if(n.tagName==="BR"){s.append(document.createElement("br"));return}if((n.tagName==="DIV"||n.tagName==="SPAN")&&ie(n.dataset.composeTextAlign)){const c=ie(n.dataset.composeTextAlign),p=document.createElement("div");p.className="compose-rich-align",p.dataset.composeTextAlign=c,p.style.textAlign=c,Array.from(n.childNodes).forEach(d=>o(d,p)),s.append(p);return}if(n.tagName==="SPAN"){const c=n.dataset.composeFontId,p=ct(n.dataset.composeTextSizeScale);if(c&&R[c]||p){const d=document.createElement("span"),m=[];c&&R[c]&&(m.push("compose-rich-font"),d.dataset.composeFontId=c,d.style.fontFamily=R[c]),p&&(m.push("compose-rich-size"),d.dataset.composeTextSizeScale=String(p),d.style.fontSize=`${p}em`),d.className=m.join(" "),Array.from(n.childNodes).forEach(x=>o(x,d)),s.append(d);return}}if(n.tagName==="DIV"||n.tagName==="P"){s.childNodes.length&&s.append(document.createElement("br")),Array.from(n.childNodes).forEach(c=>o(c,s));return}Array.from(n.childNodes).forEach(c=>o(c,s))};return Array.from(t.content.childNodes).forEach(i=>o(i,a)),a.innerHTML}function A(e,t){var o;const a=pt(((o=e.richTexts)==null?void 0:o[t])||"");return a||dt(e[t]||"")}function X(e){return`
    <button class="button button--ghost page-back page-back--icon compose-back-button" type="button" ${e} aria-label="Back">
      ${u("returnLeft")}
    </button>
  `}function he(e){return`
    <button class="button button--ghost page-back page-back--icon compose-close-button" type="button" ${e} aria-label="Close">
      ${u("close")}
    </button>
  `}function ht(){return`
    <div class="compose-header-add" data-pretext-add>
      <button
        class="button button--ghost page-back page-back--icon compose-add-button"
        type="button"
        data-pretext-add-toggle
        aria-label="Add layout element"
        aria-haspopup="true"
        aria-expanded="false"
      >
        ${u("compose")}
      </button>
      <div class="compose-header-add__popover" data-pretext-add-popover hidden>
        <div class="compose-header-add__row">
          <span class="compose-header-add__label">Title</span>
          <div class="compose-header-add__align">
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="left" aria-label="Add left aligned title">${u("alignLeft")}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="center" aria-label="Add centered title">${u("alignCenter")}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="right" aria-label="Add right aligned title">${u("alignRight")}</button>
          </div>
        </div>
        <div class="compose-header-add__row">
          <span class="compose-header-add__label">Body</span>
          <div class="compose-header-add__align">
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="left" aria-label="Add left aligned body">${u("alignLeft")}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="center" aria-label="Add centered body">${u("alignCenter")}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="right" aria-label="Add right aligned body">${u("alignRight")}</button>
          </div>
        </div>
        <div class="compose-header-add__row compose-header-add__row--image">
          <span class="compose-header-add__label">Image</span>
          <button type="button" class="compose-header-add__image" data-pretext-add-kind="image">
            ${u("image")}
            <span>Image</span>
          </button>
        </div>
      </div>
    </div>
  `}function mt(){return`
    <button
      class="button button--ghost page-back page-back--icon compose-delete-button"
      type="button"
      data-pretext-delete
      aria-label="Delete selected element"
    >
      ${u("trash")}
    </button>
  `}function gt(e){return`
    <div class="compose-stage-header__inline-actions">
      <div class="compose-history-actions" aria-label="Edit history">
        <button class="compose-history-button" type="button" data-compose-history="undo" aria-label="Undo" disabled>
          ${u("undo")}
        </button>
        <button class="compose-history-button" type="button" data-compose-history="redo" aria-label="Redo" disabled>
          ${u("redo")}
        </button>
      </div>
      <button class="button button--ghost compose-draft-button compose-draft-button--header" type="button" data-save-compose-draft>Save Draft</button>
      <button class="button button--primary compose-submit-button compose-submit-button--header" type="button" data-compose-stage-nav="tags">${e?"Update Tags":"Tags"}</button>
      <button class="button button--ghost compose-save-image-button compose-save-image-button--header" type="button" data-save-compose-image>Save</button>
    </div>
  `}function ut(e,t,a=[]){return`
    <section class="compose-group compose-group--tags">
      <div class="compose-group__head">
        <h3>${ue[e]}</h3>
      </div>
      <div class="tag-select-grid">
        ${t.map(o=>`
          <label class="tag-check">
            <input type="checkbox" name="fixedTags" value="${o}" ${a.includes(o)?"checked":""} />
            <span>${o}</span>
          </label>
        `).join("")}
      </div>
    </section>
  `}function ft(e=z){return`
    <div class="template-carousel template-carousel--select">
      <div class="template-carousel__viewport" data-template-carousel>
        <div class="template-thumb-track">
          ${nt.map(t=>`
            <label class="template-thumb ${e===t.id?"is-active":""}">
              <input type="radio" name="templateId" value="${t.id}" ${e===t.id?"checked":""} />
              <span class="template-thumb__preview template-option__preview template-option__preview--${t.id} ${t.roughUrl?"template-thumb__preview--rough":""}" aria-hidden="true" ${t.roughUrl?`style="background-image:url('${t.roughUrl}');background-size:cover;background-position:center;"`:""}></span>
            </label>
          `).join("")}
        </div>
      </div>
    </div>
  `}function O({id:e,slotClass:t}){return`
    <div class="compose-slot ${t}" data-slot="${e}">
      <input class="field__file" id="${e}" type="file" accept="image/*" />
      <label class="compose-slot__surface" for="${e}">
        <div class="compose-slot__image" data-slot-image="${e}" hidden></div>
        <div class="compose-slot__placeholder" data-slot-placeholder="${e}">
          <span class="compose-slot__plus">${u("compose")}</span>
        </div>
      </label>
      <button class="compose-slot__remove" type="button" data-slot-remove="${e}" hidden aria-label="remove image">&times;</button>
    </div>
  `}function U({id:e,slotClass:t}){return`
    <div class="compose-slot ${t}" data-slot="${e}">
      <div class="compose-slot__surface">
        <div class="compose-slot__image" data-slot-image="${e}" hidden></div>
        <div class="compose-slot__placeholder" data-slot-placeholder="${e}">
          <span class="compose-slot__plus">${u("compose")}</span>
        </div>
      </div>
    </div>
  `}function me(e,t,a,o={}){const{editable:i=!1,interactiveSlots:s=!1}=o,n=t==="page8",c=i?"compose-sheet":"compose-sheet compose-sheet--locked",p=n?`${c} compose-sheet--custom`:c,d=i?"true":"false",m=e.textStyles||{},x=n?null:G(t),T=x!=null&&x.roughUrl?`style="background-image:url('${x.roughUrl}');"`:"";return n?`
      <div class="${p}" id="composeSheet" data-template="${t}" style="--sheet-bg:${a};">
        <div class="compose-sheet__frame">
          <div class="compose-sheet__custom-preview" aria-hidden="true">
            <span class="compose-sheet__custom-eyebrow">Custom</span>
            <strong>Free image and text layout</strong>
            <p>Add, move, resize, and crop freely on a fixed A4 page.</p>
          </div>
          <div class="compose-custom-canvas" data-custom-canvas hidden></div>
        </div>
      </div>
    `:`
    <div class="${p}" id="composeSheet" data-template="${t}" style="--sheet-bg:${a};">
      <div class="compose-sheet__frame">
        <div class="compose-sheet__outline" aria-hidden="true"></div>
        <div class="compose-sheet__footer-bar" aria-hidden="true"></div>
        <div class="compose-sheet__rough-overlay" data-compose-rough-overlay hidden ${T}></div>
        <div class="compose-sheet__shape-mask" data-compose-shape-mask="0" hidden></div>
        <div class="compose-sheet__shape-mask" data-compose-shape-mask="1" hidden></div>
        <div class="compose-custom-canvas" data-custom-canvas hidden></div>
        <div
          class="compose-sheet__text compose-editable"
          data-editable="text"
          data-placeholder="text"
          data-default-single-line="false"
          contenteditable="${d}"
          tabindex="0"
          inputmode="text"
          spellcheck="false"
          ${N(m,"text")}
        >${A(e,"text")}</div>
        <div
          class="compose-sheet__headline compose-editable"
          data-editable="headline"
          data-placeholder="text"
          data-max-chars="42"
          data-default-single-line="true"
          data-single-line="true"
          contenteditable="${d}"
          tabindex="0"
          inputmode="text"
          spellcheck="false"
          ${N(m,"headline")}
        >${A(e,"headline")}</div>
        <div
          class="compose-sheet__subhead compose-editable"
          data-editable="subhead"
          data-placeholder="subhead"
          data-max-chars="56"
          data-default-single-line="true"
          data-single-line="true"
          contenteditable="${d}"
          tabindex="0"
          spellcheck="false"
          ${N(m,"subhead")}
        >${A(e,"subhead")}</div>
        <div
          class="compose-sheet__body compose-editable"
          data-editable="text2"
          data-placeholder="text"
          data-default-single-line="false"
          contenteditable="${d}"
          tabindex="0"
          inputmode="text"
          spellcheck="false"
          ${N(m,"text2")}
        >${A(e,"text2")}</div>
        <div
          class="compose-sheet__body compose-editable"
          data-editable="text3"
          data-placeholder="text"
          data-default-single-line="false"
          contenteditable="${d}"
          tabindex="0"
          inputmode="text"
          spellcheck="false"
          ${N(m,"text3")}
        >${A(e,"text3")}</div>
        <div
          class="compose-sheet__notes compose-editable"
          data-editable="intro"
          data-placeholder="notes"
          data-max-chars="72"
          data-default-single-line="false"
          contenteditable="${d}"
          tabindex="0"
          spellcheck="false"
          ${N(m,"intro")}
        >${A(e,"intro")}</div>
        ${s?O({id:"imageInputSecondary",slotClass:"compose-slot--secondary"}):U({id:"imageInputSecondary",slotClass:"compose-slot--secondary"})}
        ${s?O({id:"imageInputAccent",slotClass:"compose-slot--accent"}):U({id:"imageInputAccent",slotClass:"compose-slot--accent"})}
        ${s?O({id:"imageInputDetail",slotClass:"compose-slot--detail"}):U({id:"imageInputDetail",slotClass:"compose-slot--detail"})}
        ${s?O({id:"imageInputPrimary",slotClass:"compose-slot--primary"}):U({id:"imageInputPrimary",slotClass:"compose-slot--primary"})}
        <div
          class="compose-sheet__body compose-editable"
          data-editable="body"
          data-placeholder="body"
          data-max-chars="120"
          data-default-single-line="false"
          contenteditable="${d}"
          tabindex="0"
          spellcheck="false"
          ${N(m,"body")}
        >${A(e,"body")}</div>
        <div
          class="compose-sheet__date compose-editable"
          data-editable="date"
          data-placeholder="date"
          data-max-chars="18"
          data-default-single-line="true"
          data-single-line="true"
          contenteditable="${d}"
          tabindex="0"
          spellcheck="false"
          ${N(m,"date")}
        >${A(e,"date")}</div>
        <div
          class="compose-sheet__editor compose-editable"
          data-editable="editor"
          data-placeholder="editor"
          data-max-chars="24"
          data-default-single-line="true"
          data-single-line="true"
          contenteditable="${d}"
          tabindex="0"
          spellcheck="false"
          ${N(m,"editor")}
        >${A(e,"editor")}</div>
      </div>
    </div>
  `}function bt(e,t){return`
    <section class="compose-group compose-group--tags-stage">
      <div class="compose-group__head">
        <h3>Tags</h3>
      </div>
      ${Object.entries(se).map(([a,o])=>ut(a,o,e)).join("")}
      <section class="compose-group compose-group--tags compose-group--tags-nested">
        <div class="compose-group__head">
          <h3>Free Tags</h3>
        </div>
        <label class="field">
          <input class="field__input" type="text" name="freeTags" placeholder="cafe, spring, film" value="${t}" />
        </label>
      </section>
    </section>
  `}function xt(e){return`
    <div class="compose-mode-switch" role="tablist" aria-label="Choose compose mode">
      <button
        class="compose-mode-switch__button ${e==="template"?"is-active":""}"
        type="button"
        data-compose-mode="template"
        aria-pressed="${e==="template"}"
      >
        Template
      </button>
      <button
        class="compose-mode-switch__button ${e==="custom"?"is-active":""}"
        type="button"
        data-compose-mode="custom"
        aria-pressed="${e==="custom"}"
      >
        Custom
      </button>
    </div>
  `}function _t(){return`
    <section class="compose-text-tray" data-compose-text-tray hidden>
      <button class="compose-sheet-resize compose-sheet-resize--start" type="button" data-compose-sheet-resize="start" aria-label="Resize text settings sheet from left corner"></button>
      <button class="compose-sheet-resize compose-sheet-resize--end" type="button" data-compose-sheet-resize="end" aria-label="Resize text settings sheet from right corner"></button>
      <div class="compose-text-tray__chrome" data-compose-text-tray-chrome>
        <button class="compose-text-tray__handle" type="button" data-compose-text-tray-close aria-label="Toggle text settings height"></button>
      </div>
      <div class="compose-text-tray__body" data-compose-text-tray-body>
        <div class="compose-text-tray__section">
          <div class="compose-text-tray__heading">
            <span>Font</span>
            <strong data-compose-text-target>Text</strong>
          </div>
          ${rt.map(e=>`
            <div class="compose-text-tray__font-group">
              <div class="compose-text-tray__options">
                ${e.options.map(t=>`
                  <button class="compose-text-tray__option" type="button" data-compose-text-font="${t.id}">
                    ${t.label}
                  </button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <div class="compose-text-tray__section">
          <div class="compose-text-tray__heading">
            <span>Size</span>
          </div>
          <div class="compose-text-tray__slider">
            <div class="compose-text-tray__stepper" aria-label="Adjust text size">
              <button class="compose-text-tray__step-button" type="button" data-compose-text-size-step="up" aria-label="Increase text size">▲</button>
              <button class="compose-text-tray__step-button" type="button" data-compose-text-size-step="down" aria-label="Decrease text size">▼</button>
            </div>
            <input type="range" min="50" max="200" step="1" value="100" data-compose-text-size />
          </div>
        </div>
        <div class="compose-text-tray__section">
          <div class="compose-text-tray__heading">
            <span>Align</span>
          </div>
          <div class="compose-text-tray__align" aria-label="Text alignment">
            <button class="compose-text-tray__align-button" type="button" data-compose-text-align="left" aria-label="Align left">
              ${u("alignLeft")}
            </button>
            <button class="compose-text-tray__align-button" type="button" data-compose-text-align="center" aria-label="Align center">
              ${u("alignCenter")}
            </button>
            <button class="compose-text-tray__align-button" type="button" data-compose-text-align="right" aria-label="Align right">
              ${u("alignRight")}
            </button>
          </div>
        </div>
        <div class="compose-text-tray__section">
          <div class="compose-text-tray__heading">
            <span>Background</span>
          </div>
          <div class="compose-text-tray__background-options" aria-label="Text box background color">
            ${pe.map(e=>`
              <button
                class="compose-text-tray__background-button"
                type="button"
                data-compose-text-background="${e.value}"
                aria-label="${e.label}"
                title="${e.label}"
              >
                <span class="compose-text-tray__background-swatch" style="--swatch:${e.value||"transparent"}"></span>
              </button>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="compose-text-tray__chrome compose-text-tray__chrome--lower" data-compose-text-tray-lower-chrome>
        <button class="compose-text-tray__handle" type="button" data-compose-text-tray-close aria-label="Toggle text settings height"></button>
      </div>
    </section>
  `}function yt({values:e,selectedId:t,selectedBackground:a}){const o=lt(t),i=o==="custom"?z:t;return`
    <section class="page page--compose page--compose--select" data-compose-stage="select">
      <header class="page-header page-header--with-back page-header--compose compose-stage-header">
        ${X("data-close-compose")}
        <div class="compose-stage-header__title-wrap">
          ${xt(o)}
        </div>
      </header>

      <section class="compose-select-shell">
        <section class="compose-preview compose-preview--select">
          ${me(e,t,a,{editable:!1,interactiveSlots:!1})}
        </section>
        <section class="compose-select-rail">
          ${o==="custom"?"":ft(i)}
          <div class="compose-select-rail__footer">
            <button class="button button--primary compose-confirm-button" type="button" data-compose-stage-nav="edit">
              ${o==="custom"?"カスタムで編集":"このテンプレで編集"}
            </button>
          </div>
        </section>
      </section>
    </section>
  `}function vt({values:e,selectedId:t,selectedBackground:a,isEditing:o}){const i=t==="page8";return`
    <section class="page page--compose page--compose--edit ${i?"page--compose--edit--page8":""}" data-compose-stage="edit">
      <header class="page-header page-header--with-back page-header--compose compose-stage-header compose-stage-header--edit">
        <div class="page-header__actions page-header__actions--compose">
          ${X('data-compose-stage-nav="select"')}
          ${gt(o)}
          ${i?ht():""}
          ${i?mt():""}
          ${he("data-close-compose")}
        </div>
      </header>

      <form class="compose-form compose-form--edit" id="composeForm">
        <section class="compose-editor compose-editor--focus ${i?"compose-editor--page8":""}">
          <section class="compose-preview compose-preview--editor ${i?"compose-preview--page8":""}">
            ${i?`<div class="compose-pretext-host compose-pretext-host--page8" data-compose-pretext-host></div>
                 ${wt()}`:me(e,t,a,{editable:!0,interactiveSlots:!0})}
            ${i?"":_t()}
          </section>
        </section>
      </form>
    </section>
  `}function wt(e){return`
    <section class="compose-custom-tools" data-custom-template-controls hidden>
      <button class="compose-sheet-resize compose-sheet-resize--start" type="button" data-compose-sheet-resize="start" aria-label="Resize custom tools sheet from left corner"></button>
      <button class="compose-sheet-resize compose-sheet-resize--end" type="button" data-compose-sheet-resize="end" aria-label="Resize custom tools sheet from right corner"></button>
      <div class="compose-custom-tools__header">
        <p class="compose-custom-tools__eyebrow">Pretext-inspired editorial controls</p>
        <h3 class="compose-custom-tools__title">Custom Layout</h3>
        <p class="compose-custom-tools__hint">Add, crop, and arrange image or text blocks freely on the page while keeping the page size fixed.</p>
      </div>
      <div class="compose-custom-tools__buttons">
        <button class="button button--ghost" type="button" data-custom-add="image">Add Image</button>
        <button class="button button--ghost" type="button" data-custom-add="text">Add Text</button>
      </div>
      <section class="compose-custom-inspector" data-custom-inspector></section>
    </section>
  `}function Tt(e="shared"){const t=e==="personal"?"personal":"shared";return`
    <div class="couple-album-tabs" role="tablist" aria-label="保存先">
      <button class="${t==="shared"?"is-active":""}" type="button" data-compose-save-scope="shared" role="tab" aria-selected="${t==="shared"}">共有に保存</button>
      <button class="${t==="personal"?"is-active":""}" type="button" data-compose-save-scope="personal" role="tab" aria-selected="${t==="personal"}">個人に保存</button>
    </div>
  `}function $t({selectedFixedTags:e,freeTagsValue:t,submitLabel:a,saveScope:o}){return`
    <section class="page page--compose page--compose--tags" data-compose-stage="tags">
      <header class="page-header page-header--with-back page-header--compose compose-stage-header">
        ${X('data-compose-stage-nav="edit"')}
        <div class="compose-stage-header__title-wrap">
          <h2 class="page-header__title compose-stage-header__title">Tags</h2>
        </div>
        ${he("data-close-compose")}
      </header>

      <form class="compose-form compose-form--tags" id="composeForm">
        <section class="compose-tag-stage">
          ${bt(e,t)}
        </section>
        <div class="compose-flow-actions">
          ${Tt(o)}
          <button class="button button--ghost compose-draft-button" type="button" data-save-compose-draft>Save Draft</button>
          <button class="button button--primary compose-submit-button" type="submit">${a}</button>
        </div>
      </form>
    </section>
  `}function At(e=z){const t=typeof e=="object"?e:{selectedTemplateId:e},a=t.draft||{},o={text:a.text||a.headline||"text",headline:a.headline||"text",subhead:a.subhead||"text",text2:a.text2||"text",text3:a.text3||"text",intro:a.intro||"text",body:a.body||"text",date:a.date||"text",editor:a.editor||"編集者 : haru",textStyles:a.textStyles||{},richTexts:a.richTexts||{}},i=t.selectedTemplateId||a.templateId||z,s="#ffffff",n=Array.isArray(a.fixedTags)?a.fixedTags:[],c=Array.isArray(a.freeTags)?a.freeTags.join(", "):a.freeTags||"",p=t.isEditing?"Update Post":"Post This Layout",d=t.stage||"select";return d==="select"?yt({values:o,selectedId:i,selectedBackground:s}):d==="tags"?$t({selectedFixedTags:n,freeTagsValue:c,submitLabel:p,saveScope:t.saveScope}):vt({values:o,selectedId:i,selectedBackground:s,isEditing:!!t.isEditing})}export{z as D,M as P,qe as a,Ve as b,Le as c,Xe as d,ee as e,je as f,G as g,Nt as h,Qe as n,Mt as p,At as r,kt as s};
