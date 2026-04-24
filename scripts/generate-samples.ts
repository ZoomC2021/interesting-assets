/**
 * Generate Sample Normalized Data
 * 
 * Creates validated sample outputs for both Atrium and Axis REITs.
 * Run: npx ts-node scripts/generate-samples.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCitationLinker } from '../src/adapters/citation-linker';
import { createAtriumAdapter } from '../src/adapters/atrium-adapter';
import { createAxisAdapter } from '../src/adapters/axis-adapter';

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

  // Write to file
  const outputPath = path.join(__dirname, '..', 'test', 'samples', 'atrium-normalized.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`✅ Atrium sample written to ${outputPath}`);
  console.log(`   - ${output.references.length} references`);
  console.log(`   - ${output.metrics.length} metrics`);
  console.log(`   - ${output.timeSeries.length} time series`);
  console.log(`   - ${output.observations.length} observations`);
  console.log(`   - ${output.riskAssessment.riskFactors.length} risk factors`);
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

  // Write to file
  const outputPath = path.join(__dirname, '..', 'test', 'samples', 'axis-normalized.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`✅ Axis sample written to ${outputPath}`);
  console.log(`   - ${output.references.length} references`);
  console.log(`   - ${output.metrics.length} metrics`);
  console.log(`   - ${output.timeSeries.length} time series`);
  console.log(`   - ${output.observations.length} observations`);
  console.log(`   - ${output.riskAssessment.riskFactors.length} risk factors`);
}

// Run generation
generateAtriumSample();
generateAxisSample();
console.log('\n✅ Sample generation complete');
