let studnum = document.getElementById('studnum');
let passnum = document.getElementById('passnum');
let sendBtn = document.getElementById('send');
let resultsDiv = document.getElementById('results');
let termSelect = document.getElementById('terms');
let termSelectionDiv = document.getElementById('termSelection');
let cookSet = document.getElementById('rememberMe');
let statistics = document.getElementById('statistics');
let statLines = document.getElementById('lines');
let showStatsBtn = document.getElementById('showStats');
let k = 1;
let tP, tPA, tT;
let PE = false;

let studCook = Cookies.get('studNum');
let passCook = Cookies.get('passNum');

if (studCook != undefined && passCook != undefined) {
	studnum.value = studCook;
	passnum.value = passCook;
}

sendBtn.addEventListener('click', () => {
	sendBtn.classList.toggle('loading');
	termSelectionDiv.classList.add('d-none');
	statistics.classList.add('d-none');
	resultsDiv.innerHTML = null;
	termSelect.innerHTML = null;

	if (cookSet.checked) {
		Cookies.set('studNum', studnum.value, { expires: 365 });
		Cookies.set('passNum', passnum.value, { expires: 365 });
	}

	$.getJSON(
		'https://api.allorigins.win/get?url=' +
		encodeURIComponent(
			'https://www.isuct.ru/student/rating/view?paspnumber=' +
			passnum.value +
			'&studnumber=' +
			studnum.value
		),
		function (data) {
			let table = $(data.contents).find('table#studrating')[0];
			if (table == undefined) {
				let emptyResults = document.getElementById('noResults').content.cloneNode(true);;
				resultsDiv.append(emptyResults);
			} else {
				let terms = $(table).find('tbody tr td:first-child');
				let uniqTerms = [];
				for (i = 0; i < terms.length; i++) {
					uniqTerms[i] = terms[i].innerText;
				}
				uniqTerms = [...new Set(uniqTerms)];
				uniqTerms.forEach((e) => {
					let option = document.createElement('option');
					option.text = e;
					termSelect.add(option);
				});

				let records = $(table).find('tbody tr');

				tT = createArray(records.length, 4);
				tP = createArray(records.length, 4);
				tPA = createArray(records.length, 4);

				let n, m, t, term;

				for (i = 0; i < records.length; i++) {
					n = 6;
					let subjectCard = document.getElementById('subjectCard').content.cloneNode(true);
					term = records[i].querySelector('td:nth-child(1)').innerText;
					term = parseInt(term);
					subjectCard.querySelector('.term').innerText = term;
					tT[i][3] = term; tP[i][3] = term; tPA[i][3] = term;
					subjectCard.querySelector('.subjectTitle').innerText = records[i].querySelector(
						'td:nth-child(2)'
					).innerText;

					// PE workaround (dirty)
					if (records[i].querySelector('td:nth-child(2)').innerText == 'Физическая культура и спорт' ||
					records[i].querySelector('td:nth-child(2)').innerText == 'Элективные курсы по физической культуре и спорту') {
						PE = true;
					} else { PE = false }

					for (ii = 0; ii < 3; ii++) {
						m = records[i].querySelector('td:nth-child(' + n + ')').innerText;
						subjectCard.querySelectorAll('.mark')[ii].innerText = m;

						if (!PE) {
							tP[i][ii] = parseInt(m);
							tPA[i][ii] = parseInt(m.match(/[^/]*$/)[0]);
						} else { tP[i][ii] = 0; tPA[i][ii] = 0; }
						n++;

						t = records[i].querySelector('td:nth-child(' + n + ')').innerText;
						subjectCard.querySelectorAll('.truancy')[ii].innerText = t;

						if (!PE) {
							tT[i][ii] = parseInt(t);
						} else { tT[i][ii] = 0; }
						n++;
					}

					resultsDiv.append(subjectCard);
				}

				filterResults(uniqTerms[0]);
				createStatistic(tP, tPA, tT, parseInt(uniqTerms[0]));
				termSelectionDiv.classList.remove('d-none');
				statistics.classList.remove('d-none');
			}
			sendBtn.classList.toggle('loading');
		}
	);
});

showStatsBtn.addEventListener('click', (e) => {
	e.preventDefault();
	document.querySelector(showStatsBtn.getAttribute('href')).classList.toggle('d-none');
});

function filterResults(term) {
	allCards = document.querySelectorAll('.card');
	allCards.forEach(e => {
		t = $(e).find('.term')[0].innerText;
		if (t != term) {
			$(e).addClass('d-none');
		} else {
			$(e).removeClass('d-none');
		}
	});
}

function createStatistic(tP, tPA, tT, t) {
	let totalPerfomance,
		totalPerformancePercent,
		totalTruancy;

	statLines.innerHTML = null;

	for (i = 0; i < 3; i++) {
		let statisticsLine = document.getElementById('statisticsLine').content.cloneNode(true);

		statisticsLine.querySelector('.kt').innerHTML = i + 1;

		totalPerfomance = 0;
		for (ii = 0; ii < tP.length; ii++) {
			totalPerfomance += tP[ii][3] == t ? tP[ii][i] : 0;
		}
		totalPerformancePercent = 0;
		for (ii = 0; ii < tPA.length; ii++) {
			totalPerformancePercent += tPA[ii][3] == t ? tPA[ii][i] : 0;
		}
		totalTruancy = 0;
		for (ii = 0; ii < tT.length; ii++) {
			totalTruancy += tT[ii][3] == t ? tT[ii][i] : 0;
		}

		statisticsLine.querySelector('.totalPerformance').innerText = totalPerfomance + '/' + totalPerformancePercent;
		statisticsLine.querySelector('.totalPerformancePercent').innerText = totalPerformancePercent == 0 ? 0 : Math.round(totalPerfomance / totalPerformancePercent * 100) + '%';
		statisticsLine.querySelector('.totalTruancy').innerText = totalTruancy;
		statLines.append(statisticsLine);
	}
}

function createArray(length) {
	var arr = new Array(length || 0),
		i = length;
	if (arguments.length > 1) {
		var args = Array.prototype.slice.call(arguments, 1);
		while (i--) arr[length - 1 - i] = createArray.apply(this, args);
	}
	return arr;
}