# Copyright 2022 Stanford HIVDB Team, Frontier Science & Technology Research
# Foundation
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy
# of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations under
# the License.
# 
# ADDITIONAL DISCLAIMER: In addition to the standard warranty exclusions and
# limitations of liability set forth in sections 7, 8 and 9 of the Apache 2.0
# license that governs the use and development of this software, Frontier
# Science & Technology Research Foundation disclaims any liability for use of
# this software for patient care or in clinical settings. This software was
# developed solely for use in medical and public health research, and was not
# intended, designed, or validated to guide patient care.


# These are the productions of the grammar. The first production is 
# used by the implicit start production.                           
# ?, * and + have the same meaning as in a regular expression.      
# 
# A production can have more than one factor.
# 
# Each alternative element can be explicitly named by preceding it 
# with a name enclosed in brackets and followed by | or a colon 
# if it is the last element in list. 

### Productions ###

asi -> (booleancondition | scorecondition) {% id %}

booleancondition -> (
    condition {% id %} |
    booleancondition _ logicsymbol _ condition {% booleancondition %}
) {% id %}

condition -> l_par _ booleancondition _ r_par {% d => d[2] %}
           | residue {% id %}
           | excludestatement {% id %}
           | selectstatement {% id %}

logicsymbol -> and {% id %} | or {% id %}

residue -> amino_acid:? _ integer _ amino_acid:+ {% residue %}
         | not amino_acid:? _ integer _ amino_acid:+ {% residuenot %}
         | amino_acid:? _ integer _ l_par _ not _ amino_acid:+ _ r_par {% residueinvert %}

excludestatement -> exclude _ residue {% d => ({op: d[0], cond: d[2]}) %}

selectstatement -> select _ selectstatement2 {% d => ({op: d[0], ...d[2]}) %}

selectstatement2 -> exactly _ integer _ from _ l_par _ selectlist _ r_par {% d => ({cond: {op: d[0], num: d[2]}, from: d[8]}) %}
                  | atleast _ integer _ from _ l_par _ selectlist _ r_par {% d => ({cond: {op: d[0], num: d[2]}, from: d[8]}) %}
                  | notmorethan _ integer _ from _ l_par _ selectlist _ r_par {% d => ({cond: {op: d[0], num: d[2]}, from: d[8]}) %}
                  | atleast _ integer _ logicsymbol _ notmorethan _ integer _ from _ l_par _ selectlist _ r_par {% d => ({
                    cond: {
                      op: d[4],
                      conds: [
                        {op: d[0], num: d[2]},
                        {op: d[6], num: d[8]}
                      ]
                    },
                    from: d[14]
                  }) %}

selectlist -> residue listitems:* {% d => [d[0], ...d[1]] %}

listitems -> _ comma _ residue {% d => d[3] %}

scorecondition -> score _ from _ l_par _ scorelist _ r_par {% d => ({op: d[0], scores: d[6]}) %}

scorelist -> scoreitem scoreitems:* {% d => [d[0], ...d[1]] %}

scoreitem -> booleancondition _ mapper _ number {% d => ({cond: d[0], score: d[4]}) %}
           | max _ l_par _ scorelist _ r_par {% d => ({op: 'MAX_SCORE', scores: d[4]}) %}

scoreitems -> _ comma _ scoreitem {% d => d[3] %}
                       
number -> minus:? _ posnumber {% d => d[0] ? -d[2] : d[2] %}
posnumber -> integer {% id %} | float {% id %}


# These are character sets and regular expressions used in the definition of
# tokens. 
# Note: Helpers can not be used in productions

### HELPERS ###

digit -> [0-9] {% id %}


# These are token definitions. The entire grammar is made up of these
# expressions.  Every base production (meaning the production does not depend
# on any other production) will consist entirely of tokens, all other
# production will consist of productions and tokens.             

### TOKENS ###

minus       -> "-" {% id %}
and         -> "AND" {% id %}
or          -> "OR" {% id %}
not         -> "NOT" {% id %}
exclude     -> "EXCLUDE" {% id %}
select      -> "SELECT" {% id %}
from        -> "FROM" {% id %}
atleast     -> "ATLEAST" {% id %}
exactly     -> "EXACTLY" {% id %}
notmorethan -> "NOTMORETHAN" {% id %}
score       -> "SCORE" {% id %}
max         -> "MAX" {% id %}

l_par       -> "(" {% id %}
r_par       -> ")" {% id %}
mapper      -> "=>" {% id %}
comma       -> "," {% id %}

integer     -> digit:+ {% d => Number.parseInt(d[0].join('')) %}
float       -> digit:+ "." digit:+ {% d => Number.parseFloat(d[0].join('') + '.' + d[2].join('')) %}
amino_acid  -> [ACDEFGHIKLMNPQRSTVWYZdi] {% id %}


_ -> wschar:* {% () => BLANK %}
wschar -> [ \t\n\f] {% id %}

@{%

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

%}
