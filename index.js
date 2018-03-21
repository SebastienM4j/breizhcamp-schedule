const request = require('request');
const rx = require('rxjs');
const moment = require('moment-timezone');

moment.locale('fr')

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const eventStartMoment = event => moment(event.event_start, "YYYY-MM-DD'T'HH:mm:ss'Z'")
const eventEndMoment = event => moment(event.event_end, "YYYY-MM-DD'T'HH:mm:ss'Z'")

const bzhcampEventToMd = event => `### ${event.name}
[${event.format}]
**${eventStartMoment(event).utc().format('HH:mm').capitalize()} - ${eventEndMoment(event).utc().format('HH:mm')} @ ${event.venue}**
${event.speakers}

${event.description}
`;

var previousDay = null;
const bzhcampEventTitleToMd = event => {
    var eventDay = moment(event.event_start, "YYYY-MM-DD'T'HH:mm:ss'Z'").utc().format('dddd').capitalize();
    if(eventDay !== previousDay) {
        console.log('# '+eventDay+'\n');
        previousDay = eventDay;
    }
}

const scheduleObservable = rx.Observable.create(observer => {
        const options = {
            url: 'https://api.cfp.io/api/schedule',
            headers: { 'X-Tenant-Id': 'breizhcamp' }
        };
        request(options, (error, response, body) => {
            if (error) {
                observer.error(error);
            } else {
                observer.next(JSON.parse(body));
            }
            observer.complete();
        });
    })
    .map(events => events.sort((eventA, eventB) => {
        const dateComparison = eventStartMoment(eventA).valueOf() - eventStartMoment(eventB).valueOf();
        if(dateComparison != 0) {
            return dateComparison;
        } else {
            return eventA.venue.localeCompare(eventB.venue);
        }
    }))
    .flatMap(events => events)
    .filter(event => event.active === 'Y')
    .do(bzhcampEventTitleToMd)
    .map(bzhcampEventToMd);

scheduleObservable.subscribe(
    eventAsText => console.log(eventAsText),
    error => console.error('😡😲😡 Failed to load schedule:', error),
    () => console.log('😊 Happy breizhcamp!')
);
