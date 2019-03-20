let studnum = document.querySelector('#studnum');
let passnum = document.querySelector('#passnum');
let sendBtn = document.querySelector('#send');
let resultsDiv = document.querySelector('#results');
let termSelect = document.querySelector('#terms');
let termSelectionDiv = document.querySelector('#termSelection');

sendBtn.addEventListener('click', () => {
	$(sendBtn).toggleClass('loading');
	termSelectionDiv.classList.add('d-none');
	resultsDiv.innerHTML = null;

	$.getJSON(
		'https://api.allorigins.win/get?url=' +
			encodeURIComponent(
				'https://www.isuct.ru/student/rating/view?paspnumber=' +
					passnum.value +
					'&studnumber=' +
					studnum.value
			),
		function(data) {
			let table = $(data.contents).find('table#studrating')[0];
			let terms = $(table).find('tbody tr td:first-child');
			let uniqTerms = [];
			for (i = 0; i < terms.length; i++) {
				uniqTerms[i] = terms[i].innerText;
			}
			uniqTerms = [ ...new Set(uniqTerms) ];
			uniqTerms.forEach((e) => {
				let option = document.createElement('option');
				option.text = e;
				termSelect.add(option);
			});

			let records = $(table).find('tbody tr');
			let n;

			for (i = 0; i < records.length; i++) {
				n = 6;
				let subjectCard = document.getElementById('subjectCard').content.cloneNode(true);
				subjectCard.querySelector('.term').innerText = records[i].querySelector(
					'td:nth-child(1)'
				).innerText;
				subjectCard.querySelector('.subjectTitle').innerText = records[i].querySelector(
					'td:nth-child(2)'
				).innerText;
				for (ii = 0; ii < 3; ii++) {
					subjectCard.querySelectorAll('.mark')[ii].innerText = records[i].querySelector(
						'td:nth-child(' + n + ')'
					).innerText;
					n++;
					subjectCard.querySelectorAll('.truancy')[ii].innerText = records[
						i
					].querySelector('td:nth-child(' + n + ')').innerText;
					n++;
				}

				resultsDiv.append(subjectCard);
			}

			filterResults(uniqTerms[0]);

			$(sendBtn).toggleClass('loading');
			termSelectionDiv.classList.remove('d-none');
		}
	);
});

function filterResults(term) {
	allCards = document.querySelectorAll('.card');
	allCards.forEach((e) => {
		t = $(e).find('.term')[0].innerText;
		if (t != term) {
			$(e).addClass('d-none');
		} else {
			$(e).removeClass('d-none');
		}
	});
}
