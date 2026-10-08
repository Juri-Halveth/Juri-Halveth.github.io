'use strict';

const reportTitles={
  'reports/FREE_NEWS_006_JURI_ENERGY_MODEL_PROVENANCE_AUDIT.md':'FREE NEWS 006 — Energie-Modell: Quellen und Provenienz',
  'reports/FREE_NEWS_011_HISTORICAL_CIPHER_111_DECODING_CHALLENGE.md':'FREE NEWS 011 — Historische Chiffre 111',
  'reports/FREE_NEWS_016_PUBLIC_GITHUB_PROJECT_CONSTELLATION.md':'FREE NEWS 016 — Öffentliche GitHub-Projektkonstellation'
};

function repositoryLabel(){
  return 'HALVETH';
}

function researchTitle(sourcePath,fallback){
  return reportTitles[sourcePath]||fallback;
}

function researchTranslation(value,language){
  const translations={
    'FREE NEWS 006 — Energie-Modell: Quellen und Provenienz':{
      en:'FREE NEWS 006 — Energy model: sources and provenance',
      ru:'БЕСПЛАТНЫЕ НОВОСТИ 006 — Энергетическая модель: источники и происхождение'
    },
    'FREE NEWS 011 — Historische Chiffre 111':{
      en:'FREE NEWS 011 — Historical cipher 111',
      ru:'БЕСПЛАТНЫЕ НОВОСТИ 011 — Исторический шифр 111'
    },
    'FREE NEWS 016 — Öffentliche GitHub-Projektkonstellation':{
      en:'FREE NEWS 016 — Public GitHub project constellation',
      ru:'БЕСПЛАТНЫЕ НОВОСТИ 016 — Публичная структура проектов GitHub'
    }
  };
  const arrow=value.endsWith(' ↗'),base=arrow?value.slice(0,-2):value,translated=translations[base]?.[language];
  return translated?(translated+(arrow?' ↗':'')):null;
}

function publicText(value,language='de'){
  const sourceDisplayNotes={
    'Namenszeile ausgelassen; Originaltext unverändert verlinkt.':{
      en:'Author line omitted; original text remains unchanged at the source link.',
      ru:'Строка с именем автора пропущена; оригинальный текст доступен по ссылке без изменений.'
    },
    'Der SHA-256 bindet den vollständigen Originalauszug; die Namenszeile ist in dieser Anzeige ausgelassen.':{
      en:'The SHA-256 binds the complete original excerpt; the author line is omitted from this display.',
      ru:'SHA-256 относится к полному исходному фрагменту; строка с именем автора скрыта в этом отображении.'
    },
    'Eine verlinkte Testdefinition hat einen eigenen Ausführungsbeleg.':{
      en:'A linked test definition has a separate execution receipt.',
      ru:'Определение связанного теста имеет отдельное подтверждение выполнения.'
    }
  };
  const figureTitle={de:'HALVETH · Figurenprofil',en:'HALVETH · Character profile',ru:'HALVETH · Профиль персонажа'}[language]||'HALVETH';
  const profileFile={de:'Arbeitsprofil (Lebenslauf)',en:'Professional profile (CV)',ru:'Профессиональный профиль (резюме)'}[language]||'HALVETH';
  const birthThesis={de:'Geburtsthese',en:'Birth thesis',ru:'Тезис о рождении'}[language]||'HALVETH';
  let result=String(value);
  for(const [source,translations] of Object.entries(sourceDisplayNotes)){
    result=result.replaceAll(source,translations[language]||source);
  }
  return result
    .replace(/JURI\s*[·:]\s*HALVETH/giu,figureTitle)
    .replace(/entities\/juri\/index\.html/giu,figureTitle)
    .replace(/profil\/CV-Juri-Halveth\.md/giu,profileFile)
    .replace(/Juri-Halveth\.github\.io/giu,'HALVETH')
    .replace(/juri-janovski-these-zur-geburt/giu,birthThesis)
    .replace(/Juri-Halveth\/Juri-Halveth/giu,'HALVETH / Profil')
    .replace(/Juris Space/giu,'HALVETH')
    .replace(/Juri-Halveth/giu,'HALVETH')
    .replace(/Juri\s+(?:Janovski|Halveth)/giu,'HALVETH')
    .replace(/Юрий\s+Халвет/giu,'HALVETH')
    .replace(/Юрий/giu,'HALVETH')
    .replace(/\bJuris\b/giu,'HALVETH')
    .replace(/\bJuri\b/giu,'HALVETH')
    .replace(/profil\/CV-Juri-Halveth\.md/giu,'profil/CV.md');
}

module.exports={publicText,repositoryLabel,researchTitle,researchTranslation};
