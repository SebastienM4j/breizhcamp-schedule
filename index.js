const request = require('request');
const rx = require('rxjs');
const moment = require('moment-timezone');

const eventStartMoment = event => moment(event.event_start, "YYYY-MM-DD'T'HH:mm:ss'Z'")
const eventEndMoment = event => moment(event.event_end, "YYYY-MM-DD'T'HH:mm:ss'Z'")

const bzhcampEventToMd = event => `# ${event.format} ${event.name} - ${event.venue}
${eventStartMoment(event).utc().format('dddd DD/MM HH:mm')} - ${eventEndMoment(event).utc().format('HH:mm')}, by ${event.speakers}

${event.description}
`;

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
    .map(bzhcampEventToMd);

scheduleObservable.subscribe(
    eventAsText => console.log(eventAsText),
    error => console.error('😡😲😡 Failed to load schedule:', error),
    () => console.log('😊 Happy breizhcamp!')
);
