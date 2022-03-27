const fetchData = async() => {
  const BASE_URL = 'http://interview-data.herokuapp.com';
  try{
    const res = await Promise.all([
      fetch(`${BASE_URL}/survey-responses`),
      fetch(`${BASE_URL}/survey-questions`),
      fetch(`${BASE_URL}/surveys`),
      fetch(`${BASE_URL}/companies`)
    ]);
    const data = await Promise.all(res.map(r => r.json()));
   
    return {
      surveyResponses: data[0],
      surveyQuestions: data[1],
      surveys: data[2],
      companies: data[3]
    }
  } catch {
    throw Error('promise failed');
  }
}


const getSurveyIdAndPrompt = (q_id, surveyQuestions) => {
  const [question] = surveyQuestions.filter((question) => question.id === q_id);
  return {
    survey_id: question.survey_id,
    prompt: question.prompt
  }
}

const getSurveyAndCompanyName = (surveyId, surveys) => {
  const [survey] = surveys.filter((survey) => survey.id === surveyId);
  return {
    company_id: survey.company_id,
    surveyName: survey.name
  }
}


const getCompanyName = (compId, companies) => {
  const [company] = companies.filter((company) => company.id === compId);
  return company.name;
}


const scoring = (score, obj) => {
  switch(score) {
    case -2:
      obj["-2"] += 1;
      break;
    case -1:
      obj["-1"] += 1;
      break;
    case 0:
      obj["0"] += 1;
      break;
    case 1:
      obj["1"] += 1;
      break;
    case 2:
      obj["2"] += 1;
      break;
  }
}

const calcAverage = (obj) => {
  let tempTotal = 0;
  let tempCount = 0;
  for(const item in obj) {
    tempTotal = tempTotal + Number(item) * obj[item];
    tempCount += obj[item];
  }
  return Number(tempTotal/tempCount).toFixed(2);
}


const surveySummary = async () => {
  const {surveyResponses, surveyQuestions, surveys, companies} = await fetchData();
  const surveyData = new Set();
  let output = "";

  surveyResponses.map((response) => {
    
    const {survey_id, prompt} = getSurveyIdAndPrompt(response.question_id, surveyQuestions);
    const {company_id, surveyName} = getSurveyAndCompanyName(survey_id, surveys);
    const companyName = getCompanyName(company_id, companies);
    
    if(!surveyData.has(companyName)) {
      surveyData.add(companyName);
      surveyData[companyName] = {};
    }
    

    if(!surveyData[companyName][surveyName]) surveyData[companyName][surveyName] = {};
    if(!surveyData[companyName][surveyName][prompt]) {
      
        surveyData[companyName][surveyName][prompt] = {
          "-2": 0,
          "-1": 0,
          "0": 0,
          "1": 0,
          "2": 0
        };
    } 
    scoring(response.score, surveyData[companyName][surveyName][prompt]);
    
    
  })
  const companiesWithSurvey = Array.from(surveyData);
  
  
  companiesWithSurvey.forEach((company) => {
    
    
    const surveys = surveyData[company];
    
    for(const survey in surveys) {
      output = output + `/////////////////////////////////${"\n"}${company} - ${survey}${"\n"}/////////////////////////////////${"\n"} ${"\n"}`;

      const prompts = surveys[survey];
      for(const prompt in prompts) {
        output = output + `${prompt} ${"\n"} ------------------ ${"\n"}`;
        const scores = prompts[prompt];
        output = output + `Average: ${calcAverage(scores)} ${"\n"}Distribution: Strongly Disagree: ${scores["-2"]}, Disagree: ${scores["-1"]}, Neutral: ${scores["0"]}, Agree: ${scores["1"]}, Strongly Agree: ${scores["2"]} ${"\n"} ${"\n"}`;
        
      }
    }
    
  })
  
  return output;
  
// JPMorgan Chase - Survey A

// I find my work energizing and motivating.
// ----------
// Average: 0.12
// Distribution: Strongly Disagree: 9, Disagree: 7, Neutral: 4, ...
}




surveySummary().then(output => console.log(output));
