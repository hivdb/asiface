const config = {
  preloads: [
    {
      family: 'HIVDB',
      version: '9.1',
      date: '2022-06-02',
      url: (
        'https://raw.githubusercontent.com/hivdb/hivfacts/' +
        'main/data/algorithms/HIVDB_9.1.xml'
      )
    },
    {
      family: 'ANRS',
      version: '30',
      date: '2019-11-01',
      url: (
        'https://raw.githubusercontent.com/hivdb/hivfacts/' +
        'main/data/algorithms/ANRS_30.xml'
      )
    },
    {
      family: 'Rega',
      version: '10.0',
      date: '2017-05-22',
      url: (
        'https://raw.githubusercontent.com/hivdb/hivfacts/' +
        'main/data/algorithms/Rega_10.0.xml'
      )
    }
  ],
  mutations: 'RT:184V'
};

export default config;
