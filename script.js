document.addEventListener('DOMContentLoaded', () => {
  const elementCache = {};
  const $ = id => elementCache[id] || (elementCache[id] = document.getElementById(id));

  function bindSlider(id, valId) {
    const slider = $(id);
    const display = $(valId);
    const update = () => {
      const val = parseInt(slider.value);
      // Show 5 if it's a legendary slider and value is 4
      if (id === 'legendInt' || id === 'legendCha') {
        display.textContent = val === 4 ? 5 : val;
      } else {
        display.textContent = val;
      }
      calculate();
      updateVideoButton();
    };
    slider.addEventListener('input', update);
    update();
  }


  const videoButton = $('videoButton');

  function updateVideoButton() {
    const show =
      getVal('baseInt') === 2 &&
      getVal('legendInt') === 3 &&
      getVal('baseCha') === 4 &&
      getVal('legendCha') === 5;
    videoButton.style.display = show ? 'block' : 'none';
  }

  bindSlider('baseInt', 'baseIntVal');
  bindSlider('legendInt', 'legendIntVal');
  bindSlider('baseCha', 'baseChaVal');
  bindSlider('legendCha', 'legendChaVal');
  bindSlider('teamMembers', 'teamMembersVal');
  bindSlider('lunchboxes', 'lunchboxVal');

  function getVal(id) {
    const val = parseInt($(id).value) || 0;
    if ((id === 'legendInt' || id === 'legendCha') && val === 4) {
      return 5;
    }
    return val;
  }


  // Define the helper function OUTSIDE calculate()
  function resolveFoodBonus(base, foodType, tags, mutationType, sin) {
    if (mutationType === 'none' || mutationType === 'nil') {
      return base;
    }

    if (foodType === mutationType) {
      return base * (sin ? 2.5 : 2);
    }

    const isOpposite =
      (mutationType === 'herbivore' && foodType === 'carnivore')
      || (mutationType === 'carnivore' && foodType === 'herbivore');

    if (isOpposite) {
      return tags.includes('tea') ? base : 0;
    }

    return base;
  }

  function getUnderArmorBonuses() {
    const type = $('underArmorType').value;
    const variant = $('underArmorVariant').value;

    let intBonus = 0;
    let chaBonus = 0;

    if (type === 'casual') {
      if (variant === 'treated' || variant === 'resistant') {
        intBonus = 1;
        chaBonus = 1;
      } else if (variant === 'protective') {
        intBonus = 1;
        chaBonus = 2;
      } else if (variant === 'shielded') {
        intBonus = 3;
        chaBonus = 3;
      }
    } else if (type === 'vault') {
      if (variant === 'resistant' || variant === 'protective' || variant === 'shielded') {
        intBonus = 2;
      }
    }

    return {
      int: intBonus,
      cha: chaBonus
    };
  }

  function updateUnderArmorBonusDisplay() {
    const bonus = getUnderArmorBonuses();
    const display = $('underArmorBonus');
    display.textContent = `+${bonus.int} INT +${bonus.cha} CHA`;
  }

  function getIntDamageBonus(intVal) {
    if (intVal <= 15) {
      return (17 / 14) * intVal + (53 / 14);
    } else if (intVal <= 30) {
      return (13 / 15) * intVal + 9;
    } else if (intVal <= 60) {
      return (1 / 3) * intVal + 25;
    } else if (intVal <= 100) {
      return (1 / 8) * intVal + 37.5;
    }
    return 50;
  }

  function calculate() {
    const baseInt = getVal('baseInt');
    const legendInt = getVal('legendInt');
    const baseCha = getVal('baseCha');
    const legendCha = getVal('legendCha');

    let totalInt = baseInt + legendInt;
    let totalCha = baseCha + legendCha;

    // HP bonus per unyielding piece
    const hp = $('hpTier').value;
    const hpBonus = hp === '20' ? 3 : hp === '40' ? 2 : hp === '60' ? 1 : 0;

    // Equipment checks
    const slots = ['torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    let unyCount = 0;
    let intArmorCount = 0;
    let chaArmorCount = 0;

    slots.forEach(slot => {
      if ($(`${slot}Uny`).checked) unyCount++;

      const mod = $(`${slot}Mod`).value;
      if (mod === 'int') intArmorCount++;
      if (mod === 'cha') chaArmorCount++;
    });

    totalInt += intArmorCount * 2;
    totalCha += chaArmorCount * 2;
    totalInt += unyCount * hpBonus;
    totalCha += unyCount * hpBonus;

    if ($('internalData').checked) {
      totalInt += 2;
    }


    // Weapon
    if ($('intWeapon').checked) {
      totalInt += 3;
    }

    // Perks and Mutation Conditions
    const classFreak = getVal('classFreak');
    const onTeam = $('onTeam').checked;
    const teammates = getVal('teamMembers');
    const sin = (
      $('strangeInNumbersToggle').checked
      && onTeam
      && teammates > 0
      && $('mutatedTeammate').checked
    );
    const herd = $('herdMentality').checked;
    const marsupial = $('marsupial').checked;
    const serum = $('marsupialSerum').checked;

    // Herd Mentality
    if (herd) {
      if (onTeam) {
        const herdBonus = sin ? 3 : 2;
        totalInt += herdBonus;
        totalCha += herdBonus;
      } else {
        let herdPenalty = 2;
        if (classFreak === 1) herdPenalty = 1.5;
        if (classFreak === 2) herdPenalty = 1;
        if (classFreak === 3) herdPenalty = 0.5;
        totalInt -= herdPenalty;
        totalCha -= herdPenalty;
      }
    }

    // Marsupial
    if (marsupial && !serum) {
      let penalty = 4;
      if (classFreak === 1) penalty = 3;
      if (classFreak === 2) penalty = 2;
      if (classFreak === 3) penalty = 1;
      totalInt -= penalty;
    }

    // Night Person
    const nightPerson = getVal('nightPerson');
    if (nightPerson > 0) {
      totalInt += nightPerson;
    }

    // Egg Head
    if ($('eggHead').checked) {
      totalInt += sin ? 8 : 6;
    }

    // Magnetic Personality
    const magnetic = getVal('magneticPersonality');
    if (onTeam && magnetic > 0) {
      totalCha += teammates * magnetic;
    }

    // Cola Nut
    const colaNut = getVal('colaNut');
    let colaMultiplier = 1;
    if (colaNut === 1) colaMultiplier = 2;
    else if (colaNut === 2) colaMultiplier = 3;

    // --- Mutation Type ---
    const mutationRadio = document.querySelector('input[name="mutationType"]:checked');
    const mutationType = mutationRadio ? mutationRadio.value : 'none';

    // --- CHA Food ---
    const chaFood = $('chaFood');
    const selectedChaFood = chaFood.options[chaFood.selectedIndex];
    const chaBonus = parseFloat(selectedChaFood.dataset.cha) || 0;
    const chaMutReq = selectedChaFood.dataset.mutation || 'none';
    const chaTags = selectedChaFood.dataset.tags || '';
    totalCha += resolveFoodBonus(chaBonus, chaMutReq, chaTags, mutationType, sin);

    // --- INT Food ---
    const intFood = $('intFood');
    const selectedIntFood = intFood.options[intFood.selectedIndex];
    const intBonus = parseFloat(selectedIntFood.dataset.intbonus) || 0;
    const intMutReq = selectedIntFood.dataset.mutation || 'none';
    const intTags = selectedIntFood.dataset.tags || '';
    totalInt += resolveFoodBonus(intBonus, intMutReq, intTags, mutationType, sin);

    // --- XP Food ---
    const xpFood = $('xpFood');
    const selectedXpFood = xpFood.options[xpFood.selectedIndex];
    const basexpBonus = parseFloat(selectedXpFood.dataset.xp) || 0;
    const xpMutReq = selectedXpFood.dataset.mutation || 'none';
    const xpTags = selectedXpFood.dataset.tags || '';
    let xpFoodBonus = resolveFoodBonus(basexpBonus, xpMutReq, xpTags, mutationType, sin);
    if (xpTags.includes('cola')) xpFoodBonus *= colaMultiplier;

    // --- Chem Buff ---
    const chemSelect = $('chem');
    const selectedChem = chemSelect.options[chemSelect.selectedIndex];
    const chemInt = parseFloat(selectedChem.dataset.int) || 0;
    const chemCha = parseFloat(selectedChem.dataset.cha) || 0;

    totalInt += chemInt;
    totalCha += chemCha;

    // Under Armor bonuses
    const ua = getUnderArmorBonuses();
    totalInt += ua.int;
    totalCha += ua.cha;

    // --- XP Buffs: Bobblehead and Magazine only ---
    let xpBonus = xpFoodBonus; // Only food + bobblehead + magazine affect this

    // Bobblehead
    const bobblehead = $('bobblehead').value;
    if (bobblehead === 'leader') {
      xpBonus += 5;
    } else if (bobblehead === 'intelligence') {
      totalInt += 2;
    }

    // Live & Love #8 magazine only provides XP when on a team
    if ($('magazine').checked && onTeam) {
      xpBonus += 5;
    }

    // Lunchbox Bonus (separate output)
    const lunchboxCount = getVal('lunchboxes');
    const lunchboxBonus = lunchboxCount * 25;

    // --- Mechanical Derby ---
    if ($('MechDerby').checked) {
      totalInt += 2;
    }

    // --- Scent-O-Matic ---
    if ($('ScentOMatic').checked) {
      totalCha += 2;
    }

    // --- Mothman XP Bonus ---
    let mothmanBonus = 0;
    const xpMoth = $('xpMoth').value;
    if (xpMoth === 'wisdom') mothmanBonus = 5;
    else if (xpMoth === 'trueWisdom') mothmanBonus = 15;


    // --- Bed Buff ---
    let bedBonus = 0;
    const bedBuff = $('sleepBuff').value;
    if (bedBuff !== 'none') {
      bedBonus = 5;
    }

    // --- Unreliable INT Buffs ---
    if ($('nukaTwist').checked) totalInt += 2;
    if ($('zetaInvaders').checked) totalInt += 1;
    if ($('atomicCommand').checked) totalInt += 1;
    if ($('dottie').checked) totalInt += 1;

    // --- Unreliable XP Buff ---
    let unreliableXp = 0;
    if ($('nukaInspiration').checked) unreliableXp += 5;

    // Team Type Bonuses
    let teamXpBonus = 0;
    if (onTeam) {
      const teamType = $('teamType').value;

      if (teamType === 'casual') {
        totalInt += 1 + teammates; // +1 for team, +1 per teammate
      } else if (['expeditions', 'events', 'dailyops'].includes(teamType)) {
        teamXpBonus = 25 + (25 * teammates); // +25% for team, +25% per teammate
      }
    }

    // United Ordeal
    if (
      $('Ghoul').checked
      && $('ghoulTeammate').checked
    ) {
      const ordealRank = getVal('unitedOrdeal');
      totalInt += ordealRank;
      totalCha += ordealRank;
    }

    // Ghoul penalties
    if ($('Ghoul').checked) {
      totalCha -= 10;
      if ($('feralGhoul').checked) {
        totalCha -= 99;
      }
    }

    let inspirationalBonus = 0;
    const cha = Math.max(totalCha, 1);
    const isInspirationalActive = inspirational.checked && onTeam && teammates > 0;

    if (isInspirationalActive && cha >= 1) {
      if (cha <= 15) {
        inspirationalBonus = (17 / 14) * cha + (25 / 14);
      } else if (cha <= 30) {
        inspirationalBonus = (1 / 3) * cha + 15;
      } else if (cha <= 60) {
        inspirationalBonus = (1 / 10) * cha + 22;
      } else if (cha <= 100) {
        inspirationalBonus = (1 / 20) * cha + 25;
      } else {
        inspirationalBonus = 30;
      }
    }

    // Update visual next to checkbox
    const inspirationalDisplay = $('inspirationalBonus');
    if (inspirationalDisplay) {
      inspirationalDisplay.textContent = isInspirationalActive ? `(+${inspirationalBonus.toFixed(2)}% XP)` : '';
    }

    // Apply to XP Bonus
    xpBonus += inspirationalBonus;


    // Clamp values to minimum of 1
    totalInt = Math.max(totalInt, 1);
    totalCha = Math.max(totalCha, 1);

    // Final Output
    $('outputInt').textContent = totalInt;
    $('outputCha').textContent = totalCha;
    // XP Bonus
    const totalXp = xpBonus + mothmanBonus + unreliableXp;
    const outputXp = $('outputXp').parentElement;
    if (totalXp > 0) {
      outputXp.style.display = '';
      $('outputXp').textContent = totalXp.toFixed(2) + '%';
    } else {
      outputXp.style.display = 'none';
    }

    // Bed Bonus
    const outputBed = $('outputBed').parentElement;
    if (bedBonus > 0) {
      outputBed.style.display = '';
      $('outputBed').textContent = bedBonus + '%';
    } else {
      outputBed.style.display = 'none';
    }

    // Lunchbox Bonus
    const outputLunch = $('outputLunchXp').parentElement;
    if (lunchboxBonus > 0) {
      outputLunch.style.display = '';
      $('outputLunchXp').textContent = lunchboxBonus + '%';
    } else {
      outputLunch.style.display = 'none';
    }

    // Team Bonus
    const teamXpOutput = $('outputTeamXp').parentElement;
    if (teamXpBonus > 0) {
      teamXpOutput.style.display = '';
      $('outputTeamXp').textContent = teamXpBonus + '%';
    } else {
      teamXpOutput.style.display = 'none';
    }

    function updateCalculations(totalInt, totalXp, bedBonus, lunchboxBonus, teamXpBonus) {
      const lines = [];

      // Header
      lines.push('Formula:');

      // INT multiplier
      const intMultiplier = 1 + (totalInt * 0.03);
      lines.push(`${intMultiplier.toFixed(2)} (INT)`);

      // Bonus multipliers, show only if > 0
      if (totalXp > 0) {
        lines.push(`×${(1 + totalXp / 100).toFixed(3)} (XP Buff)`);
      }

      if (bedBonus > 0) {
        lines.push(`×${(1 + bedBonus / 100)} (Sleep Buff)`);
      }
      if (lunchboxBonus > 0) {
        lines.push(`×${(1 + lunchboxBonus / 100)} (Lunchbox)`);
      }

      if (teamXpBonus > 0) {
        lines.push(`×${(1 + teamXpBonus / 100)} (Team XP)`);
      }

      // Calculate total multiplier
      let totalMultiplier = intMultiplier;
      totalMultiplier *= (1 + totalXp / 100);
      totalMultiplier *= (1 + bedBonus / 100);
      totalMultiplier *= (1 + lunchboxBonus / 100);
      totalMultiplier *= (1 + teamXpBonus / 100);

      // Update formula display
      $('calculationFormula').textContent = lines.join('\n');
      $('calculationResult').textContent = 'Total Multiplier: ' + totalMultiplier.toFixed(2) + 'x';

      // XP Test
      const baseXp = parseFloat($('baseXp').value) || 0;
      const finalXp = baseXp * totalMultiplier;
      $('xpTestResult').textContent = 'Total XP: ' + Math.round(finalXp);

      const dmgBonus = getIntDamageBonus(totalInt);
      $('scienceBonus').textContent = `+${dmgBonus.toFixed(2)}%`;
      $('pyroBonus').textContent = `+${dmgBonus.toFixed(2)}%`;
      $('cryoBonus').textContent = `+${dmgBonus.toFixed(2)}%`;
    }

    updateCalculations(totalInt, totalXp, bedBonus, lunchboxBonus, teamXpBonus);
  }

  // Event Listeners
  $('hpTier').addEventListener('change', calculate);
  document.querySelectorAll('input[type="checkbox"]').forEach(el => el.addEventListener('change', calculate));
  document.querySelectorAll('select, input[type="radio"]').forEach(el => el.addEventListener('change', calculate));
  $('underArmorType').addEventListener('change', () => {
    updateUnderArmorBonusDisplay();
    calculate();
  });
  $('underArmorVariant').addEventListener('change', () => {
    updateUnderArmorBonusDisplay();
    calculate();
  });
  $('baseXp').addEventListener('input', calculate);

  const ghoulCheckbox = $('Ghoul');
  const ordealRow = $('unitedOrdealRow');
  const ordealSelect = $('unitedOrdeal');
  const feralRow = $('feralRow');
  const feralCheckbox = $('feralGhoul');
  function toggleGhoulOptionsVisibility() {
    if (ghoulCheckbox.checked) {
      ordealRow.style.display = '';
      feralRow.style.display = '';
    } else {
      ordealRow.style.display = 'none';
      ordealSelect.value = '0'; // reset to default
      feralRow.style.display = 'none';
      feralCheckbox.checked = false;
    }
  }

  // Run once on page load
  toggleGhoulOptionsVisibility();

  // Attach listener
  ghoulCheckbox.addEventListener('change', () => {
    toggleGhoulOptionsVisibility();
    calculate(); // Recalculate on toggle
  });

  const internalData = $('internalData');
  const unyCheckboxes = Array.from(document.querySelectorAll('input[id$="Uny"]'));
  const underArmorType = $('underArmorType');
  const underArmorVariant = $('underArmorVariant');

  function updateInternalDataState() {
    const anyUnyChecked = unyCheckboxes.some(cb => cb.checked);
    const underarmorSelected =
      (underArmorType && underArmorType.value !== 'none')
      || (underArmorVariant && underArmorVariant.value !== 'none');

    if (anyUnyChecked || underarmorSelected) {
      internalData.checked = false;
      internalData.disabled = true;
    } else {
      internalData.disabled = false;
    }

    // Disable or enable UNY and Under Armor fields based on Internal Database state
    const disableOthers = internalData.checked;
    unyCheckboxes.forEach(cb => cb.disabled = disableOthers);
    if (underArmorType) underArmorType.disabled = disableOthers;
    if (underArmorVariant) underArmorVariant.disabled = disableOthers;
  }

  // Bind listeners
  internalData.addEventListener('change', () => {
    updateInternalDataState();
    calculate();
  });
  unyCheckboxes.forEach(cb =>
    cb.addEventListener('change', () => {
      updateInternalDataState();
      calculate();
    })
  );
  if (underArmorType) {
    underArmorType.addEventListener('change', () => {
      updateInternalDataState();
      calculate();
    });
  }
  if (underArmorVariant) {
    underArmorVariant.addEventListener('change', () => {
      updateInternalDataState();
      calculate();
    });
  }

  // Initialize on page load
  updateInternalDataState();

  calculate();
  updateVideoButton();

  const darkToggle = $('darkModeToggle');
  darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', darkToggle.checked);
  });
});
