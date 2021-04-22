module.exports = {
    getCurrentDate() {
        // get the current date
        ts = Date.now();
        date_full = new Date(ts);
        date = date_full.getDate();
        month = date_full.getMonth() + 1;
        year = date_full.getFullYear();
        return date + '.' + month + '.' + year;
    }
};