const trelloRequest = {
    getBlacklists: async function(username) {

        const cardIDs = ['JSp9IWri','GbPSI076','8RW7pjt3'];  
        const url1 = `https://api.trello.com/1/cards/${cardIDs[0]}`;
        const url2 = `https://api.trello.com/1/cards/${cardIDs[1]}`;
        const url3 = `https://api.trello.com/1/cards/${cardIDs[2]}`;

        const response1 = await fetch(url1);
        const response2 = await fetch(url2);
        const response3 = await fetch(url3);

        let result = 'Unknown';
        let responseJSONArr1 = [];
        let idListsArr = [];
        let resultArr = [];

        if (!response1.ok || !response2.ok || !response3.ok) {
            console.log('Error while getting data');
            let code = 'idk';
            if (!response1.ok) {
                code = response1.status;
            } else if (!response2.ok) {
                code = response2.status;
            } else if (!response3.ok) {
                code = response3.status;
            }
            return result = {
                message: 'Failed looking up data',
                code: String(code),
            }
        }

        responseJSONArr1.push(response1);
        responseJSONArr1.push(response2);
        responseJSONArr1.push(response3);

        for (i = 0; i < responseJSONArr1.length; i++) {
            const responseDataJSON = await responseJSONArr1[i].json();
            const { idList } = responseDataJSON;
            const listURL = `https://api.trello.com/1/lists/${idList}/cards`;

            const listFetch = await fetch(listURL);
            if (!listFetch.ok) {
                console.log('Error while getting cards in list');
                return result = {
                    message: 'Failed looking up data',
                    code: listFetch.status,
                }
            }

            const listFetchJSON = await listFetch.json();
            for (j = 0; j < listFetchJSON.length; j++) {
                const { name } = listFetchJSON[j];
                idListsArr.push(name);
            }
        }

        for (k = 0; k < idListsArr.length; k++) {
            if (idListsArr[k].includes(username)) {
                resultArr.push(idListsArr[k]);
            }
        }



        if (resultArr.length > 0) {
            return result = 'This user has blacklists';
        } else {
            return result = 'This user does not have blacklists';
        }



    },
};

module.exports = trelloRequest;