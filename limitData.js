export default function limitData(limit, data){
	if(!limit){return data;}
	let newData = [];
	for (let i = 0; i < limit; i++) {
		if(i === data.length){break;}
		newData.push(data[i]);
	}
	return newData;
}