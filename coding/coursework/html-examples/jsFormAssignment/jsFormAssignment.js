/* Alright, some notes:
 * This is probably the first even remotely substantial bit of JS I've written in 4 years. It's messy and not very good.
 * If I were doing this professionally (and had a bit more time), I'd likely use jQuery, Typescript, and access the value field from the DOM instead of passing it to the functions as needed. I would also not overuse IDs like I am right now.
 * I am aware that the final total accumlates rounding errors. I did not feel it was a significant issue for this assignment. */
var j = 0;
function moneyPrint(money) {
	money = Math.round(money * 100) / 100;
	
	return '$' + money + (money % 1 === 0 ? '.00' : (money * 10 % 1 === 0 ? '0' : ''));
}


/* Whether to make changes only locally (only updating affected fields) or globally (updating all fields, as I do here) can certainly be debated. The local approach is generally better in my experience, but also more prone to bugs. In the past, I usually switch to a local approach after everything is (mostly) stable, and keep the global approach around (invoking the local methods) for situations that require it. */
function updateTotal(value) {
	// Local Total Field
	if (document.getElementsByName(value + '_active')[0].checked) {
		// Number selected.
		var count = Number(document.getElementsByName(value + '_count')[0].value == '' ? 0 : document.getElementsByName(value + '_count')[0].value);

		// Base price per unit, sans modifications
		var base_price = Number(document.getElementById(value + '_basePrice').value);
		
		// Increase from a range field
		if (document.getElementsByName(value + '_range').length > 0) {
			// Find range bonus
			var range_bonus = Number(document.getElementById(value + '_rangeMult').value) * Math.pow(document.getElementsByName(value + '_range')[0].value, document.getElementById(value + '_rangeMultDegree').value);
			
			// Update display for range bonus.
			document.getElementById(value + '_rangeBonus').setAttribute('value', moneyPrint(range_bonus));
			
			// Increae base price with range bonus.
			base_price += range_bonus;
		}
		
		// Increase from a color field
		if (document.getElementsByName(value + '_color').length > 0) {
			// Find color bonus.
			if (document.getElementsByName(value + '_color')[0].value != document.getElementById(value + '_colorDefault').value) {
				var color_bonus = Number(document.getElementById(value + '_colorBonusBase').value);
			}
			else {
				var color_bonus = 0;
			}
			
			// Update display for type bonus.
			document.getElementById(value + '_colorBonus').setAttribute('value', moneyPrint(color_bonus));
			
			// Increase base price with color bonus.
			base_price += color_bonus;
		}
		
		// Increase from a type field
		if (document.getElementsByName(value + '_type').length > 0) {
			// Find type bonus.
			//var type_bonus = Number(document.getElementsByName(value + '_type')[0].options[document.getElementsByName(value + '_type')[0].selectedIndex].getAttribute('data-bonus'));
			var type_bonus = 0;
			
			for (var i = 0; i < document.getElementsByName(value + '_type').length; i++) {
				if (document.getElementsByName(value + '_type')[i].checked) {
					type_bonus = Number(document.getElementsByName(value + '_type')[i].getAttribute('data-bonus'));
					break;
				}
			}
			
			// Update display for type bonus.
			// document.getElementById(value + '_typeBonus').setAttribute('value', moneyPrint(type_bonus));
			
			// Increase base price with type bonus.
			base_price += type_bonus;
		}
		
		// Update the (visible) base price field to account for customisations.
		document.getElementById(value + '_price').setAttribute('value', moneyPrint(base_price));
		
		// Update the total price for single product field.
		document.getElementsByName(value + '_totalPrice')[0].setAttribute('value', moneyPrint(count * base_price)); // I spent forever trying to figure out why .value = wasn't working.
	}
	else {
		// Set the total price for single product field to $0.
		document.getElementsByName(value + '_totalPrice')[0].setAttribute('value', moneyPrint(0));
	};
	
	// Update the total price for all products field.
	var total = 0;
	var subtotals = document.getElementsByClassName('subtotals');
	for (i = 0; i < subtotals.length; i++) {
		total += parseFloat(subtotals[i].value.substring(1));
	}
	document.getElementById('total').value = moneyPrint(total);
	document.getElementById('total2').value = moneyPrint(total);
}

/* Originally I choose to show count by default, but it seemed more logical to hide it too by default. Thus, I'm keeping this slightly more roundabout method instead of just collapsing the entire fieldset. */
function showHide(value) {
	for (field of ['countGroup', 'colorGroup', 'rangeGroup', 'typeGroup']) {
		if (document.getElementById(value + '_' + field) === null) {
			// Do nothing.
		}
		else if (document.getElementsByName(value + '_active')[0].checked) {
			document.getElementById(value + '_' + field).style.display = 'inline';
		}
		else {
			document.getElementById(value + '_' + field).style.display = 'none';
		}
	}
}

function addItem(option) {
	// ...Why did I have to do this the hard way? Seriously, why?
	// ...I have never written anything like this (usually just use templates). ...Not sure if it's good.
	var snippet='<fieldset id="' + option.value + '_fieldset">';
		snippet += '<legend>';
			snippet += '<input type="checkbox" onclick="updateTotal(\'' + option.value + '\'); showHide(\'' + option.value + '\');" name="' + option.value + '_active" />';
			snippet += option.text;
			snippet += '(Total Price: <input type="text" class="subtotals" size="4" disabled name="' + option.value + '_totalPrice" />)';
		snippet += '</legend>';
		snippet += '<span id="' + option.value + '_countGroup">';
			snippet += 'Count: <input type="number" min="0" step="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57" value="0" name="' + option.value + '_count" onchange="updateTotal(\'' + option.value + '\');" style="width: 3em;" />';
			snippet += '*<input type="text" size="2" disabled id="' + option.value + '_price" value="$' + option.getAttribute('data-price') + '" /><br />';
			snippet += '<input type="hidden" id="' + option.value + '_basePrice" value="' + option.getAttribute('data-price') + '" />';
		snippet += '</span>';
		
		if (option.hasAttribute('data-types')) {
			var types = option.getAttribute('data-types').split(',');
			var bonuses = (option.hasAttribute('data-type-bonuses') ? option.getAttribute('data-type-bonuses').split(',') : [0]);
			
			snippet += '<span id="' + option.value + '_typeGroup">';
				snippet += 'Type: ';
				for (var i = 0; i < types.length; i++)
					snippet += '<label><input type="radio" onclick="updateTotal(\'' + option.value + '\')" name="' + option.value + '_type" value="' + types[i] + '" data-bonus="' + (i in bonuses ? bonuses[i] : bonuses[bonuses.length - 1]) + '"' + (i == 0 ? 'checked' : '') + ' />' + types[i] + ' (+' + moneyPrint(i in bonuses ? bonuses[i] : bonuses[bonuses.length - 1]) + ')</label>';
				
				/*snippet += 'Type: <select name="' + option.value + '_type" onchange="updateTotal(\'' + option.value + '\');">';
				
				for (var i = 0; i < types.length; i++)
					snippet += '<option value="' + types[i] + '" data-bonus="' + (i in bonuses ? bonuses[i] : bonuses[bonuses.length - 1]) + '">' + types[i] + '</option>';
				
				snippet += '</select>';*/
				//snippet += '+<input type="text" id="' + option.value + '_typeBonus" size="3" disabled />';
			snippet += '<br /></span>';
		}
		
		if (option.hasAttribute('data-range-name')) {
			snippet += '<span id="' + option.value + '_rangeGroup">'
				snippet += option.getAttribute('data-range-name') + ': ';
				snippet += '<input type="text" size="2" value="' + option.getAttribute('data-range-default') + '" id="' + option.value + '_rangeDisplay" name="" disabled />';
				snippet += '<input type="range" name="' + option.value + '_range" value="' + option.getAttribute('data-range-default') + '" min="' + option.getAttribute('data-range-min') + '" max="' + option.getAttribute('data-range-max') + '" onchange="document.getElementById(\'' + option.value + '_rangeDisplay\').value = this.value; updateTotal(\'' + option.value + '\');" style="width: 5em;" />';
				snippet += '+<input type="text" disabled size="3" id="' + option.value + '_rangeBonus" />';
				snippet += '<input type="hidden" id="' + option.value + '_rangeMult" value="' + option.getAttribute('data-range-mult') + '" />';
				snippet += '<input type="hidden" id="' + option.value + '_rangeMultDegree" value="' + option.getAttribute('data-range-mult-degree') + '" />';
			snippet += '<br /></span>';
		}
		
		if (option.hasAttribute('data-color')) {
			snippet += '<span id="' + option.value + '_colorGroup">';
				snippet += 'Color: <input type="color" value="' + option.getAttribute('data-color-default') + '" name="' + option.value + '_color" onchange="updateTotal(\'' + option.value + '\');" />';
				snippet += '+<input type="text" disabled size="3" id="' + option.value + '_colorBonus" />';
				snippet += '<input type="hidden" value="' + option.getAttribute('data-color-bonus') + '" id="' + option.value + '_colorBonusBase" />';
				snippet += '<input type="hidden" value="' + option.getAttribute('data-color-default') + '" id="' + option.value + '_colorDefault" />';
			snippet += '<br /></span>';
		}
		
	snippet += '</fieldset>';
	
	if (document.getElementById(option.value + '_fieldset') === null) {
		document.getElementById('products').innerHTML = snippet + document.getElementById('products').innerHTML;

		showHide(option.value);
		updateTotal(option.value);
	}
	
	return option.value;
}

function addItemSelected() {
	addItem(document.getElementById('productsList').options[document.getElementById('productsList').selectedIndex]);
}

window.onload = function() {
	var select = document.getElementById('productsList');
	
	for (var i = 0; i < select.length - 1; i++) {
		addItem(select.options[i]);
	}
}