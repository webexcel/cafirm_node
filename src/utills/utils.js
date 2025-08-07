import moment from "moment";

export const standardizedDates = (date) => {
    const parsedDate = moment(date, ['DD/MM/YYYY']);
    return parsedDate.format('YYYY-MM-DD');
};
