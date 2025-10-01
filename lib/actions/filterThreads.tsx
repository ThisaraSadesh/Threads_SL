export const filterToxicComments = async (text: string) => {
const url = 'https://nsfw-text-moderation-api.p.rapidapi.com/moderation_check.php';

  const options: RequestInit = {
    method: 'POST',
   headers: {
		'x-rapidapi-key': 'de6878b996mshfb07b1939ad6363p1cf9c1jsn462afd33a42c',
		'x-rapidapi-host': 'nsfw-text-moderation-api.p.rapidapi.com',
		'Content-Type': 'application/json'
	},
    body: JSON.stringify({ text, language: 'en' })
  };

  try {
    const response = await fetch(url, options);
    const textRes = await response.text(); // get raw text first
    let result;
    try {
      result = JSON.parse(textRes); // parse safely
    } catch {
      result = textRes; // fallback
    }
    return result;
  } catch (error) {
    console.error('Error calling moderation API:', error);
    return null;
  }
};
