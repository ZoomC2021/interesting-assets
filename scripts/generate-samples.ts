/**
 * Generate Sample Normalized Data
 * 
 * Creates validated sample outputs for all 6 REITs.
 * Writes to both test/samples/ and frontend/public/data/
 * Run: npx ts-node scripts/generate-samples.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCitationLinker } from '../src/adapters/citation-linker';
import { createAtriumAdapter } from '../src/adapters/atrium-adapter';
import { createAxisAdapter } from '../src/adapters/axis-adapter';
import { createSunwayAdapter } from '../src/adapters/sunway-adapter';
import { createPavilionAdapter } from '../src/adapters/pavilion-adapter';
import { createIgbAdapter } from '../src/adapters/igb-adapter';
import { createUoaAdapter } from '../src/adapters/uoa-adapter';
import { createCMMTAdapter } from '../src/adapters/cmmt-adapter';
import { createAlSalamAdapter } from '../src/adapters/alsalam-adapter';
import { createKIPAdapter } from '../src/adapters/kip-adapter';
import { createParadigmAdapter } from '../src/adapters/paradigm-adapter';
import { createKlccAdapter } from '../src/adapters/klcc-adapter';
import { createHektarAdapter } from '../src/adapters/hektar-adapter';
import { createSentralAdapter } from '../src/adapters/sentral-adapter';
import { createAmFIRSTAdapter } from '../src/adapters/amfirst-adapter';
import { createTowerAdapter } from '../src/adapters/tower-adapter';

/**
 * Write output to both test/samples and frontend/public/data directories
 */
function writeOutputFiles(entityName: string, output: unknown): void {
  const jsonContent = JSON.stringify(output, null, 2);

  // Write to test/samples/[entity]-normalized.json
  const testPath = path.join(__dirname, '..', 'test', 'samples', `${entityName}-normalized.json`);
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  fs.writeFileSync(testPath, jsonContent);
  console.log(`   ✅ Test sample: ${testPath}`);

  // Write to frontend/public/data/[entity].json
  const frontendPath = path.join(__dirname, '..', 'frontend', 'public', 'data', `${entityName}.json`);
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, jsonContent);
  console.log(`   ✅ Frontend data: ${frontendPath}`);
}

function generateAtriumSample(): void {
  console.log('Generating Atrium REIT sample...');

  const linker = createCitationLinker();
  
  // Load and process references
  const atriumRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'atrium-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createAtriumAdapter(linker);
  adapter.processReferences(atriumRefs);
  
  // Generate output
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('atrium', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateAxisSample(): void {
  console.log('Generating Axis REIT sample...');

  const linker = createCitationLinker();
  
  // Load and process references
  const axisRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'axis-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createAxisAdapter(linker);
  adapter.processReferences(axisRefs);
  
  // Generate output
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('axis', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateSunwaySample(): void {
  console.log('Generating Sunway REIT sample...');

  const linker = createCitationLinker();
  
  const sunwayRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'sunway-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createSunwayAdapter(linker);
  adapter.processReferences(sunwayRefs);
  
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('sunway', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generatePavilionSample(): void {
  console.log('Generating Pavilion REIT sample...');

  const linker = createCitationLinker();
  
  const pavilionRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'pavilion-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createPavilionAdapter(linker);
  adapter.processReferences(pavilionRefs);
  
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('pavilion', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateIgbSample(): void {
  console.log('Generating IGB REIT sample...');

  const linker = createCitationLinker();
  
  const igbRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'igb-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createIgbAdapter(linker);
  adapter.processReferences(igbRefs);
  
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('igb', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateUoaSample(): void {
  console.log('Generating UOA REIT sample...');

  const linker = createCitationLinker();
  
  const uoaRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'uoa-reit-references.json'), 'utf-8'
  ));
  
  const adapter = createUoaAdapter(linker);
  adapter.processReferences(uoaRefs);
  
  const output = adapter.generateOutput();

  // Write to both locations
  writeOutputFiles('uoa', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateCMMTSample(): void {
  console.log('Generating CMMT (CapitaLand Malaysia Trust) sample...');

  const linker = createCitationLinker();
  
  // Load references
  const cmmtRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'cmmt-reit-references.json'), 'utf-8'
  ));
  
  // Process through adapter
  const adapter = createCMMTAdapter(linker);
  adapter.processReferences(cmmtRefs);
  const output = adapter.generateOutput();
  
  // Write output files
  writeOutputFiles('cmmt', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateAlSalamSample(): void {
  console.log('Generating Al-Salam REIT sample...');

  const linker = createCitationLinker();
  
  // Load references
  const alsalamRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'alsalam-reit-references.json'), 'utf-8'
  ));
  
  // Process through adapter
  const adapter = createAlSalamAdapter(linker);
  adapter.processReferences(alsalamRefs);
  const output = adapter.generateOutput();
  
  // Write output files
  writeOutputFiles('alsalam', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateKIPSample(): void {
  console.log('Generating KIP REIT sample...');

  const linker = createCitationLinker();
  
  // Load references
  const kipRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'kip-reit-references.json'), 'utf-8'
  ));
  
  // Process through adapter
  const adapter = createKIPAdapter(linker);
  adapter.processReferences(kipRefs);
  const output = adapter.generateOutput();
  
  // Write output files
  writeOutputFiles('kip', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateParadigmSample(): void {
  console.log('Generating Paradigm REIT sample...');
  const linker = createCitationLinker();
  const paradigmRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'paradigm-reit-references.json'), 'utf-8'
  ));
  const adapter = createParadigmAdapter(linker);
  adapter.processReferences(paradigmRefs);
  const output = adapter.generateOutput();
  writeOutputFiles('paradigm', output);
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
}

function generateKlccSample(): void {
  console.log('Generating KLCC REIT sample...');
  const linker = createCitationLinker();
  const klccRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'klcc-reit-references.json'), 'utf-8'
  ));
  const adapter = createKlccAdapter(linker);
  adapter.processReferences(klccRefs);
  const output = adapter.generateOutput();
  writeOutputFiles('klcc', output);
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateHektarSample(): void {
  console.log('Generating Hektar REIT sample...');

  const linker = createCitationLinker();

  // Load references
  const hektarRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'hektar-reit-references.json'), 'utf-8'
  ));

  // Process through adapter
  const adapter = createHektarAdapter(linker);
  adapter.processReferences(hektarRefs);
  const output = adapter.generateOutput();

  // Write output files
  writeOutputFiles('hektar', output);

  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateSentralSample(): void {
  console.log('Generating Sentral REIT sample...');

  const linker = createCitationLinker();

  // Load references
  const sentralRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'sentral-reit-references.json'), 'utf-8'
  ));

  // Process through adapter
  const adapter = createSentralAdapter(linker);
  adapter.processReferences(sentralRefs);
  const output = adapter.generateOutput();

  // Write output files
  writeOutputFiles('sentral', output);

  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateAmFIRSTSample(): void {
  console.log('Generating AmFIRST REIT sample...');

  const linker = createCitationLinker();

  // Load references
  const amfirstRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'amfirst-reit-references.json'), 'utf-8'
  ));

  // Process through adapter
  const adapter = createAmFIRSTAdapter(linker);
  adapter.processReferences(amfirstRefs);
  const output = adapter.generateOutput();

  // Write output files
  writeOutputFiles('amfirst', output);

  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

function generateTowerSample(): void {
  console.log('Generating Tower REIT sample...');

  const linker = createCitationLinker();

  // Load references
  const towerRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'tower-reit-references.json'), 'utf-8'
  ));

  // Process through adapter
  const adapter = createTowerAdapter(linker);
  adapter.processReferences(towerRefs);
  const output = adapter.generateOutput();

  // Write output files
  writeOutputFiles('tower', output);

  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}

// Run generation
generateAtriumSample();
generateAxisSample();
generateSunwaySample();
generatePavilionSample();
generateIgbSample();
generateUoaSample();
generateCMMTSample();
generateAlSalamSample();
generateKIPSample();
generateParadigmSample();
generateKlccSample();
generateHektarSample();
generateSentralSample();
generateAmFIRSTSample();
generateTowerSample();
console.log('\n✅ Sample generation complete');
