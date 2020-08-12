const student_id = document.getElementById('student-id');
const passport_number = document.getElementById('passport-number');
const get_results_btn = document.getElementById('get-results-btn');
const results_wrap = document.getElementById('results');
const term_select = document.getElementById('terms-select');
const term_selectection_wrap = document.getElementById('term-selection');
const cookies_set_chekbox = document.getElementById('remember-me-checkbox');
const statistics = document.getElementById('statistics');
const statistics_lines_wrap = document.getElementById('statistics-lines');
const show_statistics_btn = document.getElementById('show-statistics-btn');

let studend_id_cookie = Cookies.get('STUD_ID');
let passport_number_cookie = Cookies.get('PASS_NUM');

if (studend_id_cookie != undefined && passport_number_cookie != undefined) {
	student_id.value = studend_id_cookie;
	passport_number.value = passport_number_cookie;
}

get_results_btn.addEventListener('click', async () => get_results(), false);

show_statistics_btn.addEventListener('click', (e) => {
	e.preventDefault();
	document.querySelector(show_statistics_btn.getAttribute('href')).classList.toggle('d-none');
});

function filter_results_by_term(term) {
	all_subject_cards = document.querySelectorAll('.card');
	all_subject_cards.forEach(card => {
		card_term = card.querySelector('.term').innerText;
		card_term !=term ? card.classList.add("d-none") : card.classList.remove("d-none");
	});
}

function create_statistic(t_p, t_p_p, t_a, term) {
	let total_progress,
		total_progress_percentage,
		total_absences;

	statistics_lines_wrap.innerHTML = null;

	const statistics_line_template = document.getElementById('statistics-line').content.cloneNode(true);

	for (i = 0; i < 3; i++) {
		let statistics_line =  statistics_line_template.cloneNode(true);

		statistics_line.querySelector('.kt').innerHTML = i + 1;

		total_progress = 0;
		for (j = 0; j < t_p.length; j++) {
			total_progress += t_p[j][3] == term ? t_p[j][i] : 0;
		}
		total_progress_percentage = 0;
		for (j = 0; j < t_p_p.length; j++) {
			total_progress_percentage += t_p_p[j][3] == term ? t_p_p[j][i] : 0;
		}
		total_absences = 0;
		for (j = 0; j < t_a.length; j++) {
			total_absences += t_a[j][3] == term ? t_a[j][i] : 0;
		}

		statistics_line.querySelector('.total-progress').innerText = total_progress + '/' + total_progress_percentage;
		statistics_line.querySelector('.total-progress-percentage').innerText = total_progress_percentage == 0 ? 0 : Math.round(total_progress / total_progress_percentage * 100) + '%';
		statistics_line.querySelector('.total-absences').innerText = total_absences;
		statistics_lines_wrap.append(statistics_line);
	}
}

function create_nesting_array(length) {
	let arr = new Array(length || 0),
		i = length;
	if (arguments.length > 1) {
		let args = Array.prototype.slice.call(arguments, 1);
		while (i--) arr[length - 1 - i] = create_nesting_array.apply(this, args);
	}
	return arr;
}

async function get_results() {
	get_results_btn.classList.toggle('loading');
	term_selectection_wrap.classList.add('d-none');
	statistics.classList.add('d-none');
	results_wrap.innerHTML = null;
	term_select.innerHTML = null;

	if (cookies_set_chekbox.checked) {
		Cookies.set('STUD_ID', student_id.value, { expires: 365 });
		Cookies.set('PASS_NUM', passport_number.value, { expires: 365 });
	}

	let url = `https://api.allorigins.win/get?url=${encodeURIComponent(
		`https://www.isuct.ru/student/rating/view?paspnumber=${passport_number.value}&studnumber=${student_id.value}`
	)}`

	await fetch(url).then((response) => {
		get_results_btn.classList.toggle('loading');
		return response.text();
	}).then((html) => {
		const parser = new DOMParser();
		const parsing_document = parser.parseFromString(html, 'text/html');

		const data_table = parsing_document.querySelector('table#studrating');
		const terms = data_table.querySelectorAll('tbody tr td:first-child');
		let unique_terms = [];
		let student_progress, potential_progress, total_absences, column, points, absences, term, subject_card;
		let PE = false;
		const subject_card_template = document.getElementById('subject-card').content.cloneNode(true);

		terms.forEach((element, index) => {
			unique_terms[index] = element.innerText;
		});
		[...new Set(unique_terms)].forEach((element) => {
			let option = document.createElement('option');
			option.text = element;
			term_select.add(option);
		});

		const records = data_table.querySelectorAll('tbody tr');

		total_absences = create_nesting_array(records.length, 4);
		student_progress = create_nesting_array(records.length, 4);
		potential_progress = create_nesting_array(records.length, 4);

		for (i = 0; i < records.length; i++) {
			column = 6;
			subject_card = subject_card_template.cloneNode(true);
			term = parseInt(records[i].querySelector('td:nth-child(1)').innerText);
			subject_card.querySelector('.term').innerText = term;
			total_absences[i][3] = student_progress[i][3] = potential_progress[i][3] = term;
			subject_card.querySelector('.subject-title').innerText = records[i].querySelector(
				'td:nth-child(2)'
			).innerText;

			// PE workaround (dirty)
			if (records[i].querySelector('td:nth-child(2)').innerText == 'Физическая культура и спорт' ||
				records[i].querySelector('td:nth-child(2)').innerText == 'Элективные курсы по физической культуре и спорту') {
				PE = true;
			} else { PE = false }

			for (j = 0; j < 3; j++) {
				points = records[i].querySelector('td:nth-child(' + column + ')').innerText;
				subject_card.querySelectorAll('.points')[j].innerText = points;

				if (!PE) {
					student_progress[i][j] = parseInt(points);
					potential_progress[i][j] = parseInt(points.match(/[^/]*$/)[0]);
				} else { student_progress[i][j] = 0; potential_progress[i][j] = 0; }
				column++;

				absences = records[i].querySelector('td:nth-child(' + column + ')').innerText;
				subject_card.querySelectorAll('.absences')[j].innerText = absences;

				if (!PE) {
					total_absences[i][j] = parseInt(absences);
				} else { total_absences[i][j] = 0; }
				column++;
			}

			results_wrap.append(subject_card);
		}

		filter_results_by_term(unique_terms[0]);
		create_statistic(student_progress, potential_progress, total_absences, parseInt(unique_terms[0]));
		term_selectection_wrap.classList.remove('d-none');
		statistics.classList.remove('d-none');
	}).catch((error) => {
		console.warn('Something went wrong.', error);
		let empty_results_template = document.getElementById('no-results').content.cloneNode(true);
		results_wrap.append(empty_results_template);
	});
}