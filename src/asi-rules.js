// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


const BLANK = new Object();

function skipBlank(dd) {
  return dd.filter(d => d !== BLANK);
}

function statement(name) {
  return d => [name, ...skipBlank(d)];
}

function booleancondition(d) {
  return {op: d[2], conds: [d[0], d[4]]};
}

function residue(d) {
  return {op: 'RESIDUE_MATCH', ref: d[0], pos: d[2], aas: d[4].join('')};
}

function residuenot(d) {
  return {op: 'RESIDUE_NOT', ref: d[1], pos: d[3], aas: d[5].join('')};
}

function residueinvert(d) {
  return {op: 'RESIDUE_INVERT', ref: d[0], pos: d[2], aas: d[8].join('')};
}

var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "asi$subexpression$1", "symbols": ["booleancondition"]},
    {"name": "asi$subexpression$1", "symbols": ["scorecondition"]},
    {"name": "asi", "symbols": ["asi$subexpression$1"], "postprocess": id},
    {"name": "booleancondition$subexpression$1", "symbols": ["condition"], "postprocess": id},
    {"name": "booleancondition$subexpression$1", "symbols": ["booleancondition", "_", "logicsymbol", "_", "condition"], "postprocess": booleancondition},
    {"name": "booleancondition", "symbols": ["booleancondition$subexpression$1"], "postprocess": id},
    {"name": "condition", "symbols": ["l_par", "_", "booleancondition", "_", "r_par"], "postprocess": d => d[2]},
    {"name": "condition", "symbols": ["residue"], "postprocess": id},
    {"name": "condition", "symbols": ["excludestatement"], "postprocess": id},
    {"name": "condition", "symbols": ["selectstatement"], "postprocess": id},
    {"name": "logicsymbol", "symbols": ["and"], "postprocess": id},
    {"name": "logicsymbol", "symbols": ["or"], "postprocess": id},
    {"name": "residue$ebnf$1", "symbols": ["amino_acid"], "postprocess": id},
    {"name": "residue$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "residue$ebnf$2", "symbols": ["amino_acid"]},
    {"name": "residue$ebnf$2", "symbols": ["residue$ebnf$2", "amino_acid"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "residue", "symbols": ["residue$ebnf$1", "_", "integer", "_", "residue$ebnf$2"], "postprocess": residue},
    {"name": "residue$ebnf$3", "symbols": ["amino_acid"], "postprocess": id},
    {"name": "residue$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "residue$ebnf$4", "symbols": ["amino_acid"]},
    {"name": "residue$ebnf$4", "symbols": ["residue$ebnf$4", "amino_acid"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "residue", "symbols": ["not", "residue$ebnf$3", "_", "integer", "_", "residue$ebnf$4"], "postprocess": residuenot},
    {"name": "residue$ebnf$5", "symbols": ["amino_acid"], "postprocess": id},
    {"name": "residue$ebnf$5", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "residue$ebnf$6", "symbols": ["amino_acid"]},
    {"name": "residue$ebnf$6", "symbols": ["residue$ebnf$6", "amino_acid"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "residue", "symbols": ["residue$ebnf$5", "_", "integer", "_", "l_par", "_", "not", "_", "residue$ebnf$6", "_", "r_par"], "postprocess": residueinvert},
    {"name": "excludestatement", "symbols": ["exclude", "_", "residue"], "postprocess": d => ({op: d[0], cond: d[2]})},
    {"name": "selectstatement", "symbols": ["select", "_", "selectstatement2"], "postprocess": d => ({op: d[0], ...d[2]})},
    {"name": "selectstatement2", "symbols": ["exactly", "_", "integer", "_", "from", "_", "l_par", "_", "selectlist", "_", "r_par"], "postprocess": d => ({cond: {op: d[0], num: d[2]}, from: d[8]})},
    {"name": "selectstatement2", "symbols": ["atleast", "_", "integer", "_", "from", "_", "l_par", "_", "selectlist", "_", "r_par"], "postprocess": d => ({cond: {op: d[0], num: d[2]}, from: d[8]})},
    {"name": "selectstatement2", "symbols": ["notmorethan", "_", "integer", "_", "from", "_", "l_par", "_", "selectlist", "_", "r_par"], "postprocess": d => ({cond: {op: d[0], num: d[2]}, from: d[8]})},
    {"name": "selectstatement2", "symbols": ["atleast", "_", "integer", "_", "logicsymbol", "_", "notmorethan", "_", "integer", "_", "from", "_", "l_par", "_", "selectlist", "_", "r_par"], "postprocess":  d => ({
          cond: {
            op: d[4],
            conds: [
              {op: d[0], num: d[2]},
              {op: d[6], num: d[8]}
            ]
          },
          from: d[14]
        }) },
    {"name": "selectlist$ebnf$1", "symbols": []},
    {"name": "selectlist$ebnf$1", "symbols": ["selectlist$ebnf$1", "listitems"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "selectlist", "symbols": ["residue", "selectlist$ebnf$1"], "postprocess": d => [d[0], ...d[1]]},
    {"name": "listitems", "symbols": ["_", "comma", "_", "residue"], "postprocess": d => d[3]},
    {"name": "scorecondition", "symbols": ["score", "_", "from", "_", "l_par", "_", "scorelist", "_", "r_par"], "postprocess": d => ({op: d[0], scores: d[6]})},
    {"name": "scorelist$ebnf$1", "symbols": []},
    {"name": "scorelist$ebnf$1", "symbols": ["scorelist$ebnf$1", "scoreitems"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "scorelist", "symbols": ["scoreitem", "scorelist$ebnf$1"], "postprocess": d => [d[0], ...d[1]]},
    {"name": "scoreitem", "symbols": ["booleancondition", "_", "mapper", "_", "number"], "postprocess": d => ({cond: d[0], score: d[4]})},
    {"name": "scoreitem", "symbols": ["max", "_", "l_par", "_", "scorelist", "_", "r_par"], "postprocess": d => ({op: 'MAX_SCORE', scores: d[4]})},
    {"name": "scoreitems", "symbols": ["_", "comma", "_", "scoreitem"], "postprocess": d => d[3]},
    {"name": "number$ebnf$1", "symbols": ["minus"], "postprocess": id},
    {"name": "number$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "number", "symbols": ["number$ebnf$1", "_", "posnumber"], "postprocess": d => d[0] ? -d[2] : d[2]},
    {"name": "posnumber", "symbols": ["integer"], "postprocess": id},
    {"name": "posnumber", "symbols": ["float"], "postprocess": id},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": id},
    {"name": "minus", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "and$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "and", "symbols": ["and$string$1"], "postprocess": id},
    {"name": "or$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "or", "symbols": ["or$string$1"], "postprocess": id},
    {"name": "not$string$1", "symbols": [{"literal":"N"}, {"literal":"O"}, {"literal":"T"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "not", "symbols": ["not$string$1"], "postprocess": id},
    {"name": "exclude$string$1", "symbols": [{"literal":"E"}, {"literal":"X"}, {"literal":"C"}, {"literal":"L"}, {"literal":"U"}, {"literal":"D"}, {"literal":"E"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exclude", "symbols": ["exclude$string$1"], "postprocess": id},
    {"name": "select$string$1", "symbols": [{"literal":"S"}, {"literal":"E"}, {"literal":"L"}, {"literal":"E"}, {"literal":"C"}, {"literal":"T"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "select", "symbols": ["select$string$1"], "postprocess": id},
    {"name": "from$string$1", "symbols": [{"literal":"F"}, {"literal":"R"}, {"literal":"O"}, {"literal":"M"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "from", "symbols": ["from$string$1"], "postprocess": id},
    {"name": "atleast$string$1", "symbols": [{"literal":"A"}, {"literal":"T"}, {"literal":"L"}, {"literal":"E"}, {"literal":"A"}, {"literal":"S"}, {"literal":"T"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "atleast", "symbols": ["atleast$string$1"], "postprocess": id},
    {"name": "exactly$string$1", "symbols": [{"literal":"E"}, {"literal":"X"}, {"literal":"A"}, {"literal":"C"}, {"literal":"T"}, {"literal":"L"}, {"literal":"Y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exactly", "symbols": ["exactly$string$1"], "postprocess": id},
    {"name": "notmorethan$string$1", "symbols": [{"literal":"N"}, {"literal":"O"}, {"literal":"T"}, {"literal":"M"}, {"literal":"O"}, {"literal":"R"}, {"literal":"E"}, {"literal":"T"}, {"literal":"H"}, {"literal":"A"}, {"literal":"N"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "notmorethan", "symbols": ["notmorethan$string$1"], "postprocess": id},
    {"name": "score$string$1", "symbols": [{"literal":"S"}, {"literal":"C"}, {"literal":"O"}, {"literal":"R"}, {"literal":"E"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "score", "symbols": ["score$string$1"], "postprocess": id},
    {"name": "max$string$1", "symbols": [{"literal":"M"}, {"literal":"A"}, {"literal":"X"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "max", "symbols": ["max$string$1"], "postprocess": id},
    {"name": "l_par", "symbols": [{"literal":"("}], "postprocess": id},
    {"name": "r_par", "symbols": [{"literal":")"}], "postprocess": id},
    {"name": "mapper$string$1", "symbols": [{"literal":"="}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "mapper", "symbols": ["mapper$string$1"], "postprocess": id},
    {"name": "comma", "symbols": [{"literal":","}], "postprocess": id},
    {"name": "integer$ebnf$1", "symbols": ["digit"]},
    {"name": "integer$ebnf$1", "symbols": ["integer$ebnf$1", "digit"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "integer", "symbols": ["integer$ebnf$1"], "postprocess": d => Number.parseInt(d[0].join(''))},
    {"name": "float$ebnf$1", "symbols": ["digit"]},
    {"name": "float$ebnf$1", "symbols": ["float$ebnf$1", "digit"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "float$ebnf$2", "symbols": ["digit"]},
    {"name": "float$ebnf$2", "symbols": ["float$ebnf$2", "digit"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "float", "symbols": ["float$ebnf$1", {"literal":"."}, "float$ebnf$2"], "postprocess": d => Number.parseFloat(d[0].join('') + '.' + d[2].join(''))},
    {"name": "amino_acid", "symbols": [/[ACDEFGHIKLMNPQRSTVWYZdi]/], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => BLANK},
    {"name": "wschar", "symbols": [/[ \t\n\f]/], "postprocess": id}
]
  , ParserStart: "asi"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
