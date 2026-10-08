import { Student, Contribution, Expense } from '../types';

export const INITIAL_STUDENT_NAMES = [
  'JEAN BAPTISTE Gabner Junior',
  'ADOLPHE Keyanna Vallia',
  'AUGUSTIN Arlly',
  'BAPTISTE Carla Christi Eva',
  'BERNARD Johndally',
  'BLAISE Dorah Pierre',
  'BONIFACE Stefine Yoldie',
  'BONIFACE Yonathan Yoully',
  'BONTEMPS Mc Pherson Gray',
  'CLAIRVIL Alexa J.C',
  'DUGUERRE Ridge Evard Zarvens',
  'DUVERGER Leonel Hans',
  'ETIENNE Mathéo Christian',
  'GARRAUD Annie Elsainte',
  'GOMEZ Laisha Lyvie',
  'HALL Ryan Philippe-Edouard',
  'JEAN Saina Yamiley',
  'Jean Bernard Zacharie',
  'JEAN BAPTISTE Stanley Georges',
  'Jeanty Emmenad Michaella',
  'Joseph Lorie Ylange',
  'JOSEPH Hans Michael Adoni',
  'JULES Emie Anne Jaël',
  'LOUISSAINT Carl Constant S.N',
  'Massillon Lawrence Noah',
  'MERVEILLE Nathan Sylvester',
  'MICHEL Withedjena Lorika',
  'MIDY Rayan Noé',
  'ORIGENE Tamisha Kimara',
  'PARAISON Vitnora Itsa',
  'PIERRE Christie Paola Alyssa',
  'Placide Gémima Marly',
  'Prévot James Yurri Billy',
  'SERRES Kevin Clarens',
  'SOUVERAIN Darveen-Laud',
  'Sylvaince Soly Presner A.',
  'Valcin Lyse Carithza',
  'VICTOR Lindsey Gaëlle',
];

export function getInitialStudents(): Student[] {
  return INITIAL_STUDENT_NAMES.map((name, index) => ({
    id: `std-${index + 1}`,
    name,
    totalContributed: 0,
    contributionsCount: 0
  }));
}

export const INITIAL_CONTRIBUTIONS: Contribution[] = [];

export const INITIAL_EXPENSES: Expense[] = [];
