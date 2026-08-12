const dictionary = [
  'dm', 'dcm', 'vcl', 'vl', 'vkl', 'clm', 'cmn', 'cmnr', 'cc', 'vcc', 'dkm', 'cmm', 'dmm', 'ml', 'sml',
  'dcmm', 'vclol', 'vlol', 'cml',
  'đm', 'đcm', 'đkm', 'đmm',
  'địt', 'đụ', 'đù', 'đjt', 'địt mẹ', 'đụ má', 'đù má', 'địt cụ', 'địt con', 'địt cha', 'địt bà',
  'lồn', 'cặc', 'buồi', 'bòi', 'dái', 'háng', 'bướm', 'cức', 'cứt', 'phò', 'đĩ', 'điếm', 'cave',
  'nứng', 'nứng lồn', 'nứng sảng', 'nulo', 'đĩ chó', 'điếm thúy', 'phò phạch',
  'ngu', 'sủa', 'cút', 'chó đẻ', 'khốn nạn', 'mất dạy', 'óc chó', 'óc lợn', 'óc bò', 'bại não', 'thiểu năng', 
  'súc vật', 'rác rưởi', 'phế vật', 'ăn hại', 'chó rách', 'giẻ rách', 'cặn bã', 
  'hãm', 'hãm tài', 'hãm lồn', 'xàm', 'xàm lông', 'xàm lồn', 'dẩm lồn', 'dẩm',
  'vãi lồn', 'vãi đái', 'vãi cức', 'vãi l', 'thằng lồn', 'con lồn', 'mặt lồn', 'con đĩ', 'thằng chó', 'con chó', 
  'ngậm mõm', 'câm mồm', 'câm mõm', 'chết cụ', 'chết tiệt'
];

const containsBadWords = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  for (const word of dictionary) {
    const isASCII = /^[\x00-\x7F]*$/.test(word);
    const regexString = word.split('').join('[\\s\\.\\-\\_\\*]*');
    const regex = new RegExp(isASCII ? `\\b${regexString}\\b` : regexString, 'i');
    if (regex.test(lowerText)) return true;
  }
  return false;
};

const filterBadWords = (text) => {
  if (!text) return { isBad: false, filteredText: text };
  
  let filteredText = text;
  let isBad = false;

  for (const word of dictionary) {
    const isASCII = /^[\x00-\x7F]*$/.test(word);
    const regexString = word.split('').join('[\\s\\.\\-\\_\\*]*');
    
    const regex = new RegExp(isASCII ? `\\b${regexString}\\b` : regexString, 'gi');

    // Chạy lệnh replace trực tiếp, không dùng .test() trước đó nữa
    const newText = filteredText.replace(regex, (match) => '*'.repeat(match.length));

    // Nếu newText khác với filteredText ban đầu, nghĩa là có chữ bậy đã bị thay thế
    if (newText !== filteredText) {
      isBad = true;
      filteredText = newText;
    }
  }
  
  return { isBad, filteredText };
};

module.exports = { containsBadWords, filterBadWords };