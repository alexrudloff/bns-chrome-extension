chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.type === "main_frame") {
            /* if its a btc domain, forward to the btc.us web bridge */
            let urlobj = parseURL(details.url)
            if (urlobj.tld == "btc") {
                let updatedUrl = details.url.replace(urlobj.domain, `${urlobj.domain}.us`).replace('https', 'http');
                chrome.tabs.update(details.tabId, { url: updatedUrl });
            }
            /* if you enter an unrecognized domain w/o http(s), chrome will search it on google
            this isn't a perfect answer, but provides a little bit of defense */
            if (details.url.indexOf('https://www.google.com/search') != -1) {
                let params = (new URL(details.url)).searchParams;
                let q = params.get("q");
                let tld = q.split('.').pop();
                if (tld == 'btc') {
                    chrome.tabs.update(details.tabId, { url: `http://${q}.us` });
                }
            }
        }
    }, { urls: ["<all_urls>"] }
);

/* could probably rewrite with regex or URL(), but sometimes its nice to take the long way home */
function parseURL(url) {
    parsed_url = {}

    if (url == null || url.length == 0)
        return parsed_url;

    protocol_i = url.indexOf('://');
    parsed_url.protocol = url.substr(0, protocol_i);

    remaining_url = url.substr(protocol_i + 3, url.length);
    domain_i = remaining_url.indexOf('/');
    domain_i = domain_i == -1 ? remaining_url.length - 1 : domain_i;
    parsed_url.domain = remaining_url.substr(0, domain_i);
    parsed_url.path = domain_i == -1 || domain_i + 1 == remaining_url.length ? null : remaining_url.substr(domain_i + 1, remaining_url.length);

    domain_parts = parsed_url.domain.split('.');
    switch (domain_parts.length) {
        case 2:
            parsed_url.subdomain = null;
            parsed_url.host = domain_parts[0];
            parsed_url.tld = domain_parts[1];
            break;
        case 3:
            parsed_url.subdomain = domain_parts[0];
            parsed_url.host = domain_parts[1];
            parsed_url.tld = domain_parts[2];
            break;
        case 4:
            parsed_url.subdomain = domain_parts[0];
            parsed_url.host = domain_parts[1];
            parsed_url.tld = domain_parts[2] + '.' + domain_parts[3];
            break;
    }

    parsed_url.parent_domain = parsed_url.host + '.' + parsed_url.tld;

    return parsed_url;
}