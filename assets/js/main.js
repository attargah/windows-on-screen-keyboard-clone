$(function () {

    var isShift = false;
    var isCtrl = false;
    var lastFocusInput = null;
    var symbolKeyboardPanelIndex = 1;
    const EMOJI_STORAGE_KEY = 'lastUsedEmojis';
    const SIGN_STORAGE_KEY = 'lastUsedSigns'
    /*
    const recognition = new SpeechRecognition();
    */

    var isListening = false;

    $.getLastUsedList = (key) => {
        const storedList = localStorage.getItem(key);

        if (!storedList || storedList === '{}') {
            $.saveLastUsedList(key, [])
            return $.getLastUsedList(key);
        }
        return JSON.parse(storedList);

    }

    $.saveLastUsedList = (key, list) => {
        localStorage.setItem(key, JSON.stringify({'recent': list}));
    }

    $.addItemToLastUsedList = (key, value, sectionID) => {

        let list = $.getLastUsedList(key);
        list = list.recent;
        if (list) {
            list = list.filter(item => item !== value);
        }
        list.unshift(value);
        $.saveLastUsedList(key, list);
        $.refreshRecent(key, sectionID);

    }

    $.setSectionHtmlFromData = (data, sectionID) => {
        Object.keys(data).forEach(category => {
            const vals = data[category];
            const keyboardRow = $(document).find('[data-section-id="' + sectionID + '"]').find(`[data-section="${category}"]`);
            let columnHtml = '';

            vals.forEach((val, index) => {
                if (index % 3 === 0 && index !== 0) {
                    keyboardRow.append('<div class="keyboard-row-column">' + columnHtml + '</div>');
                    columnHtml = '';
                }

                columnHtml += `<div class="keyboard-button key-button section-button" data-parent-section="${sectionID}" data-key="${val}">${val}</div>`;
            });


            if (columnHtml !== '') {
                keyboardRow.append('<div class="keyboard-row-column">' + columnHtml + '</div>');
            }
        });
    }

    $.setSectionDataFromJson = (url, sectionID) => {
        $.getJSON(url, function (data) {
            $.setSectionHtmlFromData(data, sectionID);
        });
    }

    $.showSymbolKeyboardPanel = (index) => {

        const divs = $(document).find(`[data-panel="${index}"]`);
        if (!divs.length) return;

        const toggleButtonState = (selector, condition) => {
            $(document).find(selector).toggleClass('button-disable', condition);
        };

        toggleButtonState('.keyboard-next-button', !$(document).find(`[data-panel="${index + 1}"]`).length);
        toggleButtonState('.keyboard-prev-button', !$(document).find(`[data-panel="${index - 1}"]`).length);

        $(document).find('div[data-panel]').hide();
        divs.show();
        symbolKeyboardPanelIndex = index;

    }

    $.setSymbolEnterButtonSize = () => {
        var symbolKeyboard = $(document).find('#symbolKeyboard');
        var enterButton = symbolKeyboard.find('.keyboard-enter-button');
        var keyboardButton = enterButton.prev('.keyboard-button');
        enterButton.width(keyboardButton.width())
        enterButton.height(keyboardButton.height() * 2.88)
    }

    $.refreshRecent = (key, sectionID) => {
        $(document).find('[data-section-id="' + sectionID + '"]').find('.keyboard-row[data-section=recent] div').remove();
        var data = $.getLastUsedList(key);
        $.setSectionHtmlFromData(data, sectionID);
    }

    $.pressShiftEvent = () => {
        isShift = !isShift;
        let dataName = isShift ? 'shift-key' : 'key';
        let buttons = $(document).find('.keyboard-button');
        buttons.each(function () {
            let shiftKey = $(this).data(dataName);
            if (shiftKey) {
                $(this).text(shiftKey);
            }
        })
    }

    $.showKeyboard = (id) => {
        $(document).find('.keyboard').hide();
        $(document).find(id).show();
    }

    $.enableRepeatClick = (className, intervalTime = 150, delayTime = 300) => {
        let timeout;
        let interval;

        $(document).on('mousedown', `.${className}`, function () {
            const element = $(this);
            timeout = setTimeout(() => {
                interval = setInterval(() => {
                    element.trigger("click");
                }, intervalTime);
            }, delayTime);
        });

        $(document).on('mouseup mouseleave', `.${className}`, function () {
            clearTimeout(timeout);
            clearInterval(interval);
        });
    };

    $.enableRepeatClicks = function (classNames, intervalTime = 100) {
        classNames.forEach(className => {
            $.enableRepeatClick(className, intervalTime);
        });
    };

    $.pressControlEvent = () => {
        $(document).find('.keyboard-ctrl-button').toggleClass('keyboard-button-focus');
        var buttons = $(document).find('.keyboard-button');
        if (isCtrl) {
            buttons.removeClass('key-button-disable');

            isShift = true;
            $.pressShiftEvent();


        } else {

            buttons.each(function () {
                if ($(this).is('[data-ctrl-event]')) {
                    var eventName = $(this).data('ctrl-event');
                    $(this).append('<span class="ctrl-event-text">' + eventName + '</span>');
                } else {
                    $(this).addClass('key-button-disable');
                }
            })
        }

        isCtrl = !isCtrl;
    }

    $.handleControlAction = (element) => {

        var actionName = element.data('ctrl-event');

        switch (actionName) {
            case 'Select All':
                document.execCommand("selectAll");
                break
            case 'Undo':
                document.execCommand("undo");
                break;
            case 'Cut':
                document.execCommand("cut");
                break;
            case 'Copy':
                document.execCommand("copy");
                break;
            case 'Paste':
                /*  document.execCommand("paste");*/
                navigator.clipboard.readText()
                    .then(text => {
                        let val = lastFocusInput.val();
                        lastFocusInput.val(val + text);
                    })
                    .catch(err => {
                        console.log('err:', err);
                    });
                break;

        }

        $.pressControlEvent();

    }

    $(document).ready(function () {
        $.showSymbolKeyboardPanel(1);
        $.setSymbolEnterButtonSize();
        $.showKeyboard('#defaultKeyboard')
        $(document).find('.keyboard-section-button[data-target-section="smile"]').click();
        $(document).find('.keyboard-section-button[data-target-section="marks"]').click();
        $.setSectionDataFromJson('assets/json/emojis.json', 1);
        $.setSectionDataFromJson('assets/json/signs.json', 2);
        $.refreshRecent(EMOJI_STORAGE_KEY, 1);
        $.refreshRecent(SIGN_STORAGE_KEY, 2);
        $.enableRepeatClicks([
            'key-button',
            'keyboard-delete-button',
            'keyboard-space-button',
            'keyboard-tab-button',
            'keyboard-right-button',
            'keyboard-left-button'
        ]);

        /*
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Not Supported!");
            return;
        }

        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = function (event) {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            $(lastFocusInput).text(transcript);
        };

         */
        $(document).find('[data-keyboard]').hide();
    })

    $(document).on('click', '[data-target-keyboard]', function () {
        var keyboard = $(this).data('target-keyboard');
        var keyboardElement = $(document).find('#' + keyboard);
        if (keyboardElement.length > 0){
            $(document).find('[data-keyboard]').data('keyboard','hide');
            keyboardElement.attr('data-keyboard','show');
            keyboardElement.show().draggable({ handle: ".keyboard-top-bar" });
        }

    })

    $(document).keydown(function (event) {

        $(document).find('.keyboard-button-active').removeClass('keyboard-button-active');
        let key = event.key.toLowerCase();
        var element = false;

        switch (key) {
            case 'backspace':
                element = $(document).find('.keyboard-delete-button');
                break;
            case ' ':
                element = $(document).find('.keyboard-space-button');
                break;
            case 'enter':
                element = $(document).find('.keyboard-enter-button');
                break;
            case 'shift':
                $.pressShiftEvent();
                element = $(document).find('.keyboard-shift-button');
                break;
            case 'control':
                $.pressControlEvent();
                element = $(document).find('.keyboard-ctrl-button');
                break;
            case 'arrowright':
                element = $(document).find('.keyboard-right-button');
                break;
            case 'arrowleft':
                element = $(document).find('.keyboard-left-button');
                break;
            case 'tab':
                element = $(document).find('.keyboard-tab-button');
                break;
            default:
                element = $(document).find('div[data-key="' + key + '"]');
                break;
        }

        if (element.length > 0) {

            var closestKeyboardID = element.closest('.keyboard')[0].getAttribute('id');

            if (closestKeyboardID !== 'emojiKeyboard' && closestKeyboardID !== 'signKeyboard') {
                $.showKeyboard('#' + closestKeyboardID)
            }

            if (key !== 'control' && isCtrl) {
                $.pressControlEvent();
            }

            element.addClass("keyboard-button-active");
            setTimeout(function () {
                element.removeClass("keyboard-button-active");
            }, 300)
        }


    });

    $(document).on('mousewheel DOMMouseScroll', '.keyboard-row[data-section]', function (e) {

        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
        this.scrollLeft += (delta < 0 ? 50 : -50);
    });

    $(document).on('click', '.keyboard-section-button', function () {
        var target = $(this).data('target-section');
        var section = $(document).find('.keyboard-row[data-section=' + target + ']');
        var isColor = $(this).hasClass('color-button');
        var isMultiply = $(this).is('[multiply]');

        if (!isMultiply && !isColor) {
            $(document).find('.emoji-colors-row.color-active').removeClass('color-active');
        }

        if (section) {
            section.closest('.keyboard').find('.keyboard-row[data-section]').hide();
            if (!isColor) {
                section.closest('.keyboard').find('.section-active').removeClass('section-active');
            }
            section.show();
        }

        if (isColor) {
            $(document).find('.color-active').removeClass('color-active');
            $(this).addClass('color-active');
        } else {
            $(this).addClass('section-active');
        }

    })

    $(document).on('click', '.color-button', function () {
        var data = $(this).data('target-section');
        $(document).find('.keyboard-section-button[multiply]').data('target-section', data)
    })

    $(document).on('click', '.section-button', function () {
        const buttonText = $(this).text();
        const sectionID = $(this).data('parent-section');
        if (!sectionID) {
            return null;
        }
        var key = sectionID === 1 ? EMOJI_STORAGE_KEY : SIGN_STORAGE_KEY;
        if (buttonText) {
            $.addItemToLastUsedList(key, buttonText, sectionID)
        }
    })

    $(document).on('click', '.keyboard-shift-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $('.keyboard-shift-button').toggleClass('keyboard-button-focus');
        $.pressShiftEvent();
    })

    $(document).on('click', '.keyboard-delete-button', function () {

        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;

        if (!lastFocusInput) {
            return
        }


        let focusInput = lastFocusInput[0];
        let focusInputVal = focusInput.value;
        let selectionStart = focusInput.selectionStart;
        let selectionEnd = focusInput.selectionEnd;

        if (selectionStart !== selectionEnd) {
            lastFocusInput.val(focusInputVal.slice(0, selectionStart) + focusInputVal.slice(selectionEnd));
            focusInput.setSelectionRange(selectionStart, selectionStart);
        } else if (selectionStart > 0) {
            lastFocusInput.val(focusInputVal.slice(0, selectionStart - 1) + focusInputVal.slice(selectionStart));
            focusInput.setSelectionRange(selectionStart - 1, selectionStart - 1);
        }
    })

    $(document).on('focus', 'input,textarea', function () {
        lastFocusInput = $(this);
    })

    $(document).on('click', '.keyboard-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (lastFocusInput) {
            lastFocusInput.focus();
        }
    })

    $(document).on('click', '.key-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (!lastFocusInput) {
            return
        }
        if (isCtrl) {
            return $.handleControlAction($(this));
        }


        let key = $(this).text();
        if (key) {
            let focusInputVal = lastFocusInput.val();
            lastFocusInput.val(focusInputVal + key);

        }


    })

    $(document).on('click', '.keyboard-right-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (!lastFocusInput) {
            return
        }
        var cursorPosition = lastFocusInput[0].selectionStart;

        lastFocusInput[0].setSelectionRange(cursorPosition + 1, cursorPosition + 1);

        lastFocusInput[0].focus();
    });

    $(document).on('click', '.keyboard-space-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (!lastFocusInput) {
            return
        }
        var lastFocusInputVal = lastFocusInput.val();

        lastFocusInput.val(lastFocusInputVal + " ");
    })

    $(document).on('click', '.keyboard-left-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (!lastFocusInput) {
            return
        }

        var cursorPosition = lastFocusInput[0].selectionStart;
        if (cursorPosition === 0) {
            return
        }
        lastFocusInput[0].setSelectionRange(cursorPosition, cursorPosition - 1);
        lastFocusInput[0].focus();
    });

    $(document).on('click', '.keyboard-enter-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        if (!lastFocusInput) {
            return
        }

        let formElement = lastFocusInput.closest('form');

        if (formElement) {
            formElement.submit();
        }


    })

    $(document).on('click', '.keyboard-symbols-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showKeyboard('#symbolKeyboard');
    })

    $(document).on('click', '.keyboard-letter-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showKeyboard('#defaultKeyboard');
    })

    $(document).on('click', '.keyboard-emoji-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showKeyboard('#emojiKeyboard');
    })

    $(document).on('click', '.keyboard-sign-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showKeyboard('#signKeyboard');
    })

    $(document).on('click', '.keyboard-tab-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        var focusedElement = $(':focus');
        var nextElement = focusedElement.nextAll('input, textarea, button').first();//todo fix this
        if (nextElement.length) {
            nextElement.focus();
        } else {
            $('input, textarea, button').first().focus();
        }
    })

    $(document).on('click', '.keyboard-next-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showSymbolKeyboardPanel(symbolKeyboardPanelIndex + 1)
    })

    $(document).on('click', '.keyboard-prev-button', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $.showSymbolKeyboardPanel((symbolKeyboardPanelIndex - 1))
    })

    $(document).on('click', '.keyboard-ctrl-button', function () {
        $.pressControlEvent();
    })

    $(document).on('click', '.face-button-up-arrow', function () {
        if ($(this).hasClass('key-button-disable') || $(this).hasClass('button-disable')) return;
        $(document).find('.emoji-colors-row').toggleClass('color-active');
    })

    $(document).on('click', '.keyboard-close-button', function () {
        var keyboardElement = $(document).find("[data-keyboard='show']");
        keyboardElement.hide();
        keyboardElement.attr('data-keyboard','hide');

    })

    $(document).on('click', '.keyboard-mic-key', function () {
        /*
        if (isListening){
            recognition.stop();
        }else{
            recognition.start();
        }
        */
        isListening = !isListening;
    })

})