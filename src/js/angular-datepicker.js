(function()
{
    'use strict';

    // Register the directive.
    angular.module('kf.datepicker', []).directive('kfDatepicker', kfDatepicker);

    // Inject the dependencies.
    kfDatepicker.$inject = ['$window', '$filter', 'dateParser'];

    function kfDatepicker($window, $filter, dateParser)
    {
        ///
        /// Custom datepicker using this repo as a starting point https://github.com/720kb/angular-datepicker
        /// Has a depdency on ui.bootstrap's dateParser service
        ///

        var directive = {
            restrict: "AE",
            require: '?ngModel',
            replace: true,
            scope: {
                ngModel: "=",
                dateSet: '@',
                dateId: '@',
                formId: '@',
                dateMinLimit: '@',
                dateMaxLimit: '@',
                dateMonthTitle: '@',
                dateYearTitle: '@',
                buttonNextTitle: '@',
                buttonPrevTitle: '@'
            },
            templateUrl: 'Public/client/app/home/kf-datepicker.html',
            link: link,
        }
        return directive;

        function link($scope, $element, $attrs, ctrl)
        {
            var isMouseOnInput, isMouseOn, calendarOpen = false;
            var dateFormat = $attrs.dateFormat;
            var dateMaxLimit = $scope.dateMaxLimit;
            var dateMinLimit = $scope.dateMinLimit;

            var theCalendar = $element[0].querySelector('.kf-datepicker-calendar');           
            var theInput = $element[0].querySelector('.kf-datepicker-input');

            //set up the event handlers
            angular.element(theInput).bind('focus click', function onFocusAndClick() {

                isMouseOnInput = true;

                showCalendar();
            });

            angular.element(theInput).bind('focusout blur', function onBlurAndFocusOut() {

                isMouseOnInput = false;
            });

            angular.element(theCalendar).bind('mouseenter', function onMouseEnter() {

                isMouseOn = true;
            });

            angular.element(theCalendar).bind('mouseleave', function onMouseLeave() {

                isMouseOn = false;
            });

            angular.element(theCalendar).bind('focusin', function onCalendarFocus() {

                isMouseOn = true;
            });

            angular.element($window).bind('click focus', function onClickOnWindow() {

                if (!isMouseOn &&
                  !isMouseOnInput && theCalendar && calendarOpen) {

                    hideCalendar();
                }
            });

            $scope.$watch('dateSet', function dateSetWatcher(value) {
                ///
                /// Initial date can be set using the dateSet attribute.
                /// Watch for this here and re init the calendar on change
                ///
                if (value)
                {
                    initCalendar(value);
                    setInputValue();
                }
            });
            

            ///////////////  Public Methods (called by directive template)

            $scope.setDatepickerDay = function setDatepickeDay(day)
            {
                ///
                /// Called when user selects a date (day) from the calendar
                ///
                $scope.day = Number(day);
                setInputValue();
                hideCalendar();
            };

            $scope.closeCalendar = function()
            {
                hideCalendar();
            }

            $scope.isMobile = function isMobile()
            {
                return ($window.navigator.userAgent && ($window.navigator.userAgent.match(/Android/i)
                    || $window.navigator.userAgent.match(/webOS/i)
                    || $window.navigator.userAgent.match(/iPhone/i)
                    || $window.navigator.userAgent.match(/iPad/i)
                    || $window.navigator.userAgent.match(/iPod/i)
                    || $window.navigator.userAgent.match(/BlackBerry/i)
                    || $window.navigator.userAgent.match(/Windows Phone/i)));
            };

            $scope.isSelectableMinDate = function (aDate) {
                //if current date
                if (!!$scope.dateMinLimit &&
                   !!new Date($scope.dateMinLimit) &&
                   new Date(aDate).getTime() < new Date($scope.dateMinLimit).getTime()) {

                    return false;
                }

                return true;
            };

            $scope.isSelectableMaxDate = function (aDate) {

                //if current date
                if (!!$scope.dateMaxLimit &&
                   !!new Date($scope.dateMaxLimit) &&
                   new Date(aDate).getTime() > new Date($scope.dateMaxLimit).getTime()) {

                    return false;
                }

                return true;
            };

            $scope.isSelectableMaxYear = function(year) {

                if (!!dateMaxLimit &&
                  year > new Date(dateMaxLimit).getFullYear()) {

                    return false;
                }

                return true;
            };

            $scope.isSelectableMinYear = function (year) {

                if (!!dateMinLimit &&
                  year < new Date(dateMinLimit).getFullYear()) {

                    return false;
                }

                return true;
            };

            $scope.nextMonth = function() {

                if ($scope.monthNumber === 12) {

                    $scope.monthNumber = 1;
                    //its happy new year
                    $scope.nextYear();
                } else {

                    $scope.monthNumber += 1;
                }
                //set next month
                $scope.month = $filter('date')(new Date($scope.year, $scope.monthNumber - 1), 'MMMM');
                //reinit days
                setDaysInMonth($scope.monthNumber, $scope.year);

                //check if max date is ok
                if (dateMaxLimit) {
                    if (!$scope.isSelectableMaxDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)) {

                        resetToMaxDate();
                    }
                }
                //deactivate selected day
                $scope.day = undefined;
            };

            $scope.nextYear = function() {

                $scope.year = Number($scope.year) + 1;
            };

            $scope.paginateYears = function (startingYear) {

                $scope.paginationYears = [];

                var i
                   , theNewYears = []
                   , daysToPrepend = 10, daysToAppend = 10;

                if ($scope.isMobile()) {
                    daysToPrepend = 50;
                    daysToAppend = 50;
                    if ($scope.dateMinLimit && $scope.dateMaxLimit) {
                        startingYear = new Date($scope.dateMaxLimit).getFullYear();
                        daysToPrepend = startingYear - new Date($scope.dateMinLimit).getFullYear();
                        daysToAppend = 1;
                    }
                }

                for (i = daysToPrepend; i > 0; i -= 1) {

                    theNewYears.push(Number(startingYear) - i);
                }

                for (i = 0; i < daysToAppend; i += 1) {

                    theNewYears.push(Number(startingYear) + i);
                }

                //check range dates
                if (dateMaxLimit && theNewYears && theNewYears.length && !$scope.isSelectableMaxYear(Number(theNewYears[theNewYears.length - 1]) + 1)) {

                    $scope.paginationYearsNextDisabled = true;
                } else {

                    $scope.paginationYearsNextDisabled = false;
                }

                if (dateMinLimit && theNewYears && theNewYears.length && !$scope.isSelectableMinYear(Number(theNewYears[0]) - 1)) {

                    $scope.paginationYearsPrevDisabled = true;
                } else {

                    $scope.paginationYearsPrevDisabled = false;
                }

                $scope.paginationYears = theNewYears;
            };


            $scope.prevMonth = function() {

                if ($scope.monthNumber === 1) {

                    $scope.monthNumber = 12;
                    //its happy new year
                    $scope.prevYear();
                } else {

                    $scope.monthNumber -= 1;
                }
                //set next month
                $scope.month = $filter('date')(new Date($scope.year, $scope.monthNumber - 1), 'MMMM');
                //reinit days
                setDaysInMonth($scope.monthNumber, $scope.year);
                //check if min date is ok
                if (dateMinLimit) {

                    if (!$scope.isSelectableMinDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)) {

                        resetToMinDate();
                    }
                }
                //deactivate selected day
                $scope.day = undefined;
            };

            $scope.prevYear = function() {

                $scope.year = Number($scope.year) - 1;
            };

            $scope.setNewYear = function setNewYear(year) {

                //deactivate selected day
                $scope.day = undefined;

                if (dateMaxLimit && $scope.year < Number(year)) {

                    if (!$scope.isSelectableMaxYear(year)) {

                        return;
                    }
                } else if (dateMinLimit && $scope.year > Number(year)) {

                    if (!$scope.isSelectableMinYear(year)) {

                        return;
                    }
                }

                $scope.year = Number(year);
                setDaysInMonth($scope.monthNumber, $scope.year);
                $scope.paginateYears(year);
            };


            ctrl.$parsers.push(validate);
            ctrl.$formatters.push(validate);

            initCalendar();

            ///////////////  Private Methods

            function initCalendar(value)
            {
                ///
                /// Initialise the calendar
                ///
                var date = new Date();
                if (value)
                {
                    date = new Date(value);
                }
                
                $scope.month = $filter('date')(date, 'MMMM');
                $scope.monthNumber = Number($filter('date')(date, 'MM')); // 01-12 like
                $scope.day = Number($filter('date')(date, 'dd')); //01-31 like
                $scope.year = Number($filter('date')(date, 'yyyy'));//2014 like
                $scope.paginateYears($scope.year);
                setDaysInMonth($scope.monthNumber, $scope.year);
                
            }

            function resetToMaxDate() {

                $scope.month = $filter('date')(new Date(dateMaxLimit), 'MMMM');
                $scope.monthNumber = Number($filter('date')(new Date(dateMaxLimit), 'MM'));
                $scope.day = Number($filter('date')(new Date(dateMaxLimit), 'dd'));
                $scope.year = Number($filter('date')(new Date(dateMaxLimit), 'yyyy'));
            };

            function setInputValue()
            {
                ///
                /// Update the input box with the selected date
                ///

                if ($scope.isSelectableMinDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)
            && $scope.isSelectableMaxDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)) {

                    var modelDate = new Date($scope.year + '/' + $scope.monthNumber + '/' + $scope.day);

                    if ($attrs.dateFormat) {

                        angular.element(theInput).val($filter('date')(modelDate, dateFormat));
                    } else {

                        angular.element(theInput).val(modelDate);
                    }

                    angular.element(theInput).triggerHandler('input');
                    angular.element(theInput).triggerHandler('change');//just to be sure;
                } 
            }

            function showCalendar()
            {
                ///
                /// Show the calendar popup
                ///
                if (theCalendar.classList) {
                    theCalendar.classList.add('kf-datepicker-open');
                } else {
                    $scope.classHelper.add(theCalendar, 'kf-datepicker-open');
                }
                //add a shield
                var shield = angular.element('<div class="modal-backdrop"></div>');
                angular.element(document.body).append(shield);

                calendarOpen = true;
            }

            function hideCalendar()
            {
                ///
                /// Hide the calendar popup
                ///
                if (theCalendar.classList) {
                    theCalendar.classList.remove('kf-datepicker-open');
                } else {
                    $scope.classHelper.remove(theCalendar, 'kf-datepicker-open');
                }
                //remove shield
                var shield = $window.document.getElementsByClassName('modal-backdrop');
                angular.element(shield).remove();

                calendarOpen = false;
            }

            function setDaysInMonth(month, year) 
            {
                ///
                /// Creates the array of dates for the month / year supplied
                /// Note that this method updates $scope.days, $scope.prevMonthDays, $scope.nextMonthDays
                ///
                var i
                  , limitDate = new Date(year, month, 0).getDate()
                  , firstDayMonthNumber = new Date(year + '/' + month + '/' + 1).getDay()
                  , lastDayMonthNumber = new Date(year + '/' + month + '/' + limitDate).getDay()
                  , prevMonthDays = []
                  , nextMonthDays = []
                  , howManyNextDays
                  , howManyPreviousDays
                  , monthAlias;

                $scope.days = [];

                for (i = 1; i <= limitDate; i += 1) {

                    $scope.days.push(i);
                }
                //get previous month days is first day in month is not Sunday
                if (firstDayMonthNumber !== 0) {

                    howManyPreviousDays = firstDayMonthNumber;

                    //get previous month
                    if (Number(month) === 1) {

                        monthAlias = 12;
                    } else {

                        monthAlias = month - 1;
                    }
                    //return previous month days
                    for (i = 1; i <= new Date(year, monthAlias, 0).getDate() ; i += 1) {

                        prevMonthDays.push(i);
                    }
                    //attach previous month days
                    $scope.prevMonthDays = prevMonthDays.slice(-howManyPreviousDays);
                } else {
                    //no need for it
                    $scope.prevMonthDays = [];
                }

                //get next month days is first day in month is not Sunday
                if (lastDayMonthNumber < 6) {

                    howManyNextDays = 6 - lastDayMonthNumber;
                    //get previous month

                    //return next month days
                    for (i = 1; i <= howManyNextDays; i += 1) {

                        nextMonthDays.push(i);
                    }
                    //attach previous month days
                    $scope.nextMonthDays = nextMonthDays;
                } else {
                    //no need for it
                    $scope.nextMonthDays = [];
                }
            };

            function validate(value)
            {
                var valid = true;
                if (value && value != "") {
                    valid = false;
                    var date = Date.parse(value, false);

                    if (date && !isNaN(date)) {
                        valid = true;
                    }
                }

                if (valid)
                {
                    ///
                    /// If date still deemed valid at this point, check the format using ui.bootstrap dateParser
                    ///
                    var dt = dateParser.parse(value, dateFormat);
                    if (dt == undefined)
                    {
                        valid = false;
                    }
                }

                ctrl.$setValidity("date", valid);
                // We need to set the field as touched in order for the validation messages to be displayed.
                ctrl.$setTouched();
                return valid ? value : undefined;
            }

        }
    }


})();