customElements.define('contributions-calendar',
        class extends HTMLElement {
            NUMBER_OF_WEEKS = 52;
            NUMBER_OF_DAYS_IN_WEEK = 7;
            NUMBER_OF_MILLISECONDS_IN_DAY = 86400000;

            MAX_CONTRIBUTIONS_NUMBER = 0;


            build_days_array(contributions) {
                let start_date = this.getAttribute("start-date");
                let date = new Date(start_date).getTime();
                let days_array = [];
                for (let i=0; i < this.NUMBER_OF_WEEKS; i++) {
                    for (let j=0; j < this.NUMBER_OF_DAYS_IN_WEEK; j++) {
                        let date_contribution = {};
                        if (!(i===0 && j===0)) {
                            date += this.NUMBER_OF_MILLISECONDS_IN_DAY;
                        }

                        let count = this.count_contributions(date, contributions);

                        date_contribution = {
                                count: count,
                                date: date
                        }

                        days_array.push(date_contribution);
                    }
                }

                return days_array;
            }


             count_contributions(date, contributions) {
                let start_date_in_millis = date;
                let end_date_in_millis = date + this.NUMBER_OF_MILLISECONDS_IN_DAY;
                let count = 0;

                for (let i=0; i<contributions.length; i++) {
                    let contribution = contributions[i];
                    let contribution_timestamp_in_millis = new Date(contribution).getTime();

                    if (contribution_timestamp_in_millis >= start_date_in_millis && contribution_timestamp_in_millis < end_date_in_millis) {
                        count += 1;
                    }
                }

                if (count > this.MAX_CONTRIBUTIONS_NUMBER) {
                    this.MAX_CONTRIBUTIONS_NUMBER = count;
                }

                return count;
            }

            build_day(date_contribution, week_number, day_number) {
                const day_template_string = `
                <template id="day-template">
                        <style>
                            .day {
                                margin: 1px;
                                height: 1rem;
                                width: 1rem;
                                background-color: #ebedf0;
                            }

                            .day[one-quarter] {
                                background-color: #c6e48b;
                            }

                            .day[two-quarters] {
                                background-color: #7bc96f;
                            }

                            .day[three-quarters] {
                                background-color: #239a3b;
                            }

                            .day[four-quarters] {
                                background-color: #239a3b;
                            }
                        </style>
                        <div class="day">

                        </div>
                    </template>
                `;

                const parser = new DOMParser();
                const day_template = parser.parseFromString(day_template_string, 'text/html').querySelector("#day-template");
                const day_clone = day_template.content.cloneNode("#day-template");

                let day_container = day_clone.querySelector('.day');


                day_container.title = date_contribution.count;
                day_container.id = `week-${week_number}-day-${day_number}`;
                day_container.setAttribute('date', date_contribution.date);
                day_container.setAttribute('contributions', date_contribution.count);

                let percentage = 0;
                if (date_contribution.count) {
                    let percentage = date_contribution.count / this.MAX_CONTRIBUTIONS_NUMBER
                    if (percentage >= 0 && percentage <= 0.25) {
                        day_container.setAttribute('one-quarter', '');
                    } else if (percentage > 0.25 && percentage <= 0.5) {
                        day_container.setAttribute('two-quarters', '');
                    } else if (percentage > 0.5 && percentage <= 0.75) {
                        day_container.setAttribute('three-quarters', '');
                    } else if (percentage > 0.75 && percentage <= 1) {
                        day_container.setAttribute('four-quarters', '');
                    }
                }

                return day_clone;
            }

            build_week(week, week_number) {
                const week_template_string = `
                    <template id="week-template">
                        <div class="week">

                        </div>
                    </template>
                `;

                const parser = new DOMParser();
                const week_template = parser.parseFromString(week_template_string, 'text/html').querySelector("#week-template");
                const week_clone = week_template.content.cloneNode(true);
                const week_container = week_clone.querySelector(".week");
                week_container.id = `week-${week_number}`;

                for (let j=0; j < this.NUMBER_OF_DAYS_IN_WEEK; j++) {
                    const date_contribution = week[j];

                    const day = this.build_day(date_contribution, week_number, j);

                    week_container.appendChild(day);
                }

                return week_clone;
            }

            build_container(days_array) {
                const parser = new DOMParser();
                const container_template_string = `
                    <template id="container-template">
                        <style>
                            .container {
                                display: flex;
                            }
                        </style>
                        <div class="container">

                        </div>
                    </template>
                `;


                const container_template = parser.parseFromString(container_template_string, 'text/html');
                const container = container_template.querySelector("#container-template");
                const container_clone = container.content.cloneNode(true);

                for (let i=0; i < this.NUMBER_OF_WEEKS; i++) {
                    let week = days_array.splice(0, 7);
                    let week_clone = this.build_week(week, i);

                    container_clone.querySelector('.container').appendChild(week_clone);
                    container_clone.querySelector('.container').addEventListener("click", this.clickListener);
                }

                return container_clone;

            }

            clickListener(event, detail) {
                let rootElement = event.composedPath()[0];
                if (rootElement.className === 'day') {
                    const date = rootElement.getAttribute('date');
                    const contributions = rootElement.getAttribute('contributions') | 0;

                    rootElement.dispatchEvent(new CustomEvent("contributions-calendar-day-selected", {
                        detail: {
                            date: date,
                            contributions: contributions,
                        },
                        composed: true,
                        bubbles: true,
                    }));
                }
            }


            init(contributions) {
                const shadowRoot = this.attachShadow({ mode: 'open'});
                let days_array = this.build_days_array(contributions);
                let container_clone = this.build_container(days_array);
                shadowRoot.appendChild(container_clone);
            }


            constructor() {
                super();

                this.dispatchEvent(
                    new CustomEvent("contributions-calendar-ready",
                        {
                            detail: this,
                            composed: true,
                            bubbles: true,
                        }
                    )
                );

            }
});