(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const d of o.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function n(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=n(r);fetch(r.href,o)}})();let l=[];const m="https://script.google.com/macros/s/AKfycbwLjblDkm9Dvdr663BMdICSd8KAEsraO9XCzqk6F39XvVWUzzrlPzxgG3TBVNFrxbuG/exec",h=document.getElementById("list"),s=document.querySelector("[data-lesson]"),c=document.querySelector("[data-keyword]"),p=document.querySelector(".search__clear"),g=e=>`
			<a class="list-item" href="#">
				<div class="list-item__content">
					<span class="list-item__question">${e.question}</span>
					<span class="list-item__answer">${e.answer}</span>
				</div>
			</a>
	`;function f(e){return e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^a-zA-Z0-9 ]/g," ")}function a(e,t,n){let i=e;return t!==void 0&&n!==void 0&&(i=e.substring(0,t)+"<span class='highlight'>"+e.substring(t,n)+"</span>"+e.substring(n)),i=i.replace(/\n/gm,"<br />"),i}function L(e,t){let n=t.questionLower.indexOf(e);if(n>=0)return{prior:4,question:a(t.question,n,n+e.length),answer:a(t.answer)};if(n=t.answerLower.indexOf(e),n>=0)return{prior:3,question:a(t.question),answer:a(t.answer,n,n+e.length)};let i=f(e);return n=t.questionNonAccent.indexOf(i),n>=0?{prior:2,question:a(t.question,n,n+e.length),answer:a(t.answer)}:(n=t.answerNonAccent.indexOf(i),n>=0?{prior:1,question:a(t.question),answer:a(t.answer,n,n+e.length)}:{prior:0,question:"",answer:""})}function u(){if(!l||l.length===0)return;let e=parseInt(s.value),t=c.value.toLowerCase(),n={0:"",1:"",2:"",3:"",4:""};for(let i=0;i<l.length;i++)if(!(e>0&&l[i].lessonid!==e))if(t){let r=L(t,l[i]);n[r.prior]+=g(r)}else n[1]+=g(l[i]);h.innerHTML=n[4]+n[3]+n[2]+n[1]}s&&s.addEventListener("change",u);c&&c.addEventListener("keyup",u);p&&p.addEventListener("click",()=>{c.value="",c.focus(),u()});function v(){s&&(s.disabled=!0),c&&(c.disabled=!0),h.innerHTML=`
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<div class="loading-text">Đang tải dữ liệu từ Google Sheets...</div>
		</div>
	`}function q(e){s&&(s.disabled=!0),c&&(c.disabled=!0),h.innerHTML=`
		<div class="error-container">
			<div class="error-icon">⚠️</div>
			<div class="error-text">Không thể tải dữ liệu: ${e}</div>
			<button class="retry-button" id="btn-retry">Thử lại</button>
		</div>
	`;const t=document.getElementById("btn-retry");t&&t.addEventListener("click",w)}function w(){v(),fetch(m).then(e=>{if(!e.ok)throw new Error("Lỗi kết nối mạng (HTTP "+e.status+")");return e.json()}).then(e=>{if(e.status==="success"&&e.data&&Array.isArray(e.data.questions))l=e.data.questions,l.forEach(t=>{t.questionLower=(t.question||"").toLowerCase(),t.questionNonAccent=f(t.questionLower),t.answerLower=(t.answer||"").toLowerCase(),t.answerNonAccent=f(t.answerLower)}),s&&Array.isArray(e.data.lessons)&&(s.innerHTML='<option value="0" selected>-- Tất cả --</option>',e.data.lessons.forEach(t=>{const n=document.createElement("option");n.value=t.lesson_id,n.textContent=t.lesson_name,s.appendChild(n)})),s&&(s.disabled=!1),c&&(c.disabled=!1),u();else throw new Error(e.message||"Định dạng dữ liệu không hợp lệ")}).catch(e=>{console.error("Lỗi khi tải dữ liệu:",e),q(e.message)})}w();
