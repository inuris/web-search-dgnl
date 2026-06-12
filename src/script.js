let data = [];
const apiURL = "https://script.google.com/macros/s/AKfycbwLjblDkm9Dvdr663BMdICSd8KAEsraO9XCzqk6F39XvVWUzzrlPzxgG3TBVNFrxbuG/exec";

const list = document.getElementById('list');
const userLesson = document.querySelector('[data-lesson]');
const userSearch = document.querySelector('[data-keyword]');
const clearSearch = document.querySelector('.search__clear');

// Login Screen Elements
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const rememberCheckbox = document.getElementById('remember-checkbox');
const loginError = document.getElementById('login-error');
const mainContent = document.getElementById('main-content');
const loginBtn = loginForm ? loginForm.querySelector('.login-btn') : null;

let currentPassword = "";

// Render Users
const template = (listItem) => {
	return `
			<a class="list-item" href="#">
				<div class="list-item__content">
					<span class="list-item__question">${listItem.question}</span>
					<span class="list-item__answer">${listItem.answer}</span>
				</div>
			</a>
	`;
};

function trimAccent(phrase) {
	return phrase
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.replace(/[^a-zA-Z0-9 ]/g, ' ');
}

function formatText(text, _from, _to) {
	let result = text;
	if (_from !== undefined && _to !== undefined) {
		result = text.substring(0, _from) +
			"<span class='highlight'>" +
			text.substring(_from, _to) +
			'</span>' +
			text.substring(_to);
	}
	result = result.replace(/\n/gm, '<br />');
	return result;
}

function matchKeyword(keyword, data) {
	let index = data.questionLower.indexOf(keyword);
	if (index >= 0) {
		return {
			prior: 4,
			question: formatText(data.question, index, index + keyword.length),
			answer: formatText(data.answer)
		};
	}
	index = data.answerLower.indexOf(keyword);
	if (index >= 0) {
		return {
			prior: 3,
			question: formatText(data.question),
			answer: formatText(data.answer, index, index + keyword.length),
		};
	}
	let keywordNonAccent = trimAccent(keyword);
	index = data.questionNonAccent.indexOf(keywordNonAccent);
	if (index >= 0) {
		return {
			prior: 2,
			question: formatText(data.question, index, index + keyword.length),
			answer: formatText(data.answer)
		};
	}
	index = data.answerNonAccent.indexOf(keywordNonAccent);
	if (index >= 0) {
		return {
			prior: 1,
			question: formatText(data.question),
			answer: formatText(data.answer, index, index + keyword.length),
		};
	}
	return {
		prior: 0,
		question: "",
		answer: ""
	};
}

function filter() {
	if (!data || data.length === 0) return;

	let lesson = parseInt(userLesson.value);
	let keyword = userSearch.value.toLowerCase();

	let htmlQueue = {
		0: "",
		1: "",
		2: "",
		3: "",
		4: ""
	};
	for (let i = 0; i < data.length; i++) {
		if (lesson > 0 && data[i].lessonid !== lesson) {
			continue;
		}
		if (keyword) {
			let match = matchKeyword(keyword, data[i]);
			htmlQueue[match.prior] += template(match);
		} else {
			/* Nếu ko gõ từ khóa thì hiện toàn bộ */
			htmlQueue[1] += template(data[i]);
		}
	}
	list.innerHTML = htmlQueue[4] + htmlQueue[3] + htmlQueue[2] + htmlQueue[1];
}

// Attach event listeners
if (userLesson) userLesson.addEventListener('change', filter);
if (userSearch) userSearch.addEventListener('keyup', filter);
if (clearSearch) {
	clearSearch.addEventListener('click', () => {
		userSearch.value = "";
		userSearch.focus();
		filter();
	});
}

// Show loading state initially
function showLoading() {
	if (userLesson) userLesson.disabled = true;
	if (userSearch) userSearch.disabled = true;
	list.innerHTML = `
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<div class="loading-text">Đang tải dữ liệu từ Google Sheets...</div>
		</div>
	`;
}

function showError(errMessage) {
	if (userLesson) userLesson.disabled = true;
	if (userSearch) userSearch.disabled = true;
	list.innerHTML = `
		<div class="error-container">
			<div class="error-icon">⚠️</div>
			<div class="error-text">Không thể tải dữ liệu: ${errMessage}</div>
			<button class="retry-button" id="btn-retry">Thử lại</button>
		</div>
	`;
	const retryBtn = document.getElementById('btn-retry');
	if (retryBtn) {
		retryBtn.addEventListener('click', () => {
			loadData(currentPassword, true);
		});
	}
}

// Login Screen Helper Functions
function showLoginScreen(errMsg = '') {
	if (loginScreen) loginScreen.classList.remove('hidden');
	if (mainContent) mainContent.classList.add('hidden');
	if (passwordInput) {
		passwordInput.disabled = false;
		passwordInput.value = "";
		passwordInput.focus();
	}
	if (loginBtn) {
		loginBtn.disabled = false;
		loginBtn.textContent = "Xác nhận";
	}
	if (errMsg) {
		showLoginError(errMsg);
	} else {
		if (loginError) loginError.classList.add('hidden');
	}
}

function hideLoginScreen() {
	if (loginScreen) loginScreen.classList.add('hidden');
	if (mainContent) mainContent.classList.remove('hidden');
}

function showLoginError(msg) {
	if (loginError) {
		loginError.textContent = msg;
		loginError.classList.remove('hidden');
	}
}

function setLoginLoading(isLoading) {
	if (passwordInput) passwordInput.disabled = isLoading;
	if (loginBtn) {
		loginBtn.disabled = isLoading;
		loginBtn.textContent = isLoading ? "Đang xác thực..." : "Xác nhận";
	}
	if (isLoading && loginError) {
		loginError.classList.add('hidden');
	}
}

function loadData(password, isAutoLoad = false) {
	if (!password) {
		showLoginScreen();
		return;
	}

	currentPassword = password;

	if (isAutoLoad) {
		showLoading();
		hideLoginScreen();
	} else {
		setLoginLoading(true);
	}

	const url = `${apiURL}?password=${encodeURIComponent(password)}`;

	fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error("Lỗi kết nối mạng (HTTP " + response.status + ")");
			}
			return response.json();
		})
		.then(res => {
			if (res.status === "success" && res.data && Array.isArray(res.data.questions)) {
				data = res.data.questions;

				// Process search optimization fields
				data.forEach((element) => {
					element.question = String(element.question || "");
					element.answer = String(element.answer || "");
					element.questionLower = element.question.toLowerCase();
					element.questionNonAccent = trimAccent(element.questionLower);
					element.answerLower = element.answer.toLowerCase();
					element.answerNonAccent = trimAccent(element.answerLower);
				});

				// Populate lessons dropdown dynamically
				if (userLesson && Array.isArray(res.data.lessons)) {
					userLesson.innerHTML = '<option value="0" selected>-- Tất cả --</option>';
					res.data.lessons.forEach(lesson => {
						const option = document.createElement('option');
						option.value = lesson.lesson_id;
						option.textContent = lesson.lesson_name;
						userLesson.appendChild(option);
					});
				}

				// Enable inputs
				if (userLesson) userLesson.disabled = false;
				if (userSearch) userSearch.disabled = false;

				// Save password if checked
				if (rememberCheckbox && rememberCheckbox.checked) {
					localStorage.setItem('saved_password', password);
				} else {
					localStorage.removeItem('saved_password');
				}

				// Transition to search UI
				hideLoginScreen();

				// Initial render
				filter();
			} else {
				throw new Error(res.message || "Mật khẩu không chính xác hoặc lỗi dữ liệu");
			}
		})
		.catch(error => {
			console.error("Lỗi khi tải dữ liệu:", error);

			// Clear saved password if auth failed
			localStorage.removeItem('saved_password');

			if (!isAutoLoad) {
				setLoginLoading(false);
				showLoginError(error.message);
			} else {
				showLoginScreen(error.message);
			}
		});
}

// Bind Login Form Submission
if (loginForm) {
	loginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const password = passwordInput ? passwordInput.value : '';
		if (password) {
			loadData(password, false);
		}
	});
}

// Start loading on page load
const savedPassword = localStorage.getItem('saved_password');
if (savedPassword) {
	loadData(savedPassword, true);
} else {
	showLoginScreen();
}
