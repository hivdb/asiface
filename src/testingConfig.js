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
  mutations: (
    'PR:M46MI, PR:G48V, PR:I54T, PR:V82A, PR:K43T, ' +
    'RT:M41L, RT:E44D, RT:D67N, RT:T69i, RT:M184V, RT:L210W, RT:T215Y, ' +
    'RT:K219KN, RT:A98G, RT:K103N, RT:Y181C, IN:E92Q, IN:N155H, IN:R263K'
  )
};

export default config;
