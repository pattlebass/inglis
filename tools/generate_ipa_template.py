import os
import json
import re

INPUT_FOLDER = "./tools/input"

CONVERSION_DICTS = [
    "ro"
]  # list of conversion dicts (filenames without 'ipa_to_' prefix)

# Valid IPA symbols/groups (English example, extendable)
VALID_IPA = [
    # multi-character first
    "tʃ",
    "dʒ",
    "aɪ",
    "aʊ",
    "eɪ",
    "oʊ",
    "ɔɪ",
    "ɪə",
    "eə",
    "ʊə",
    "ɡi",
    "ɡj",
    # single characters
    "p",
    "b",
    "t",
    "d",
    "k",
    "g",
    "f",
    "v",
    "θ",
    "ð",
    "s",
    "z",
    "ʃ",
    "ʒ",
    "h",
    "m",
    "n",
    "ŋ",
    "l",
    "ɹ",
    "j",
    "w",
    "ɾ",
    "i",
    "ɪ",
    "e",
    "ɛ",
    "æ",
    "ɑ",
    "ɒ",
    "ɔ",
    "o",
    "ʊ",
    "u",
    "ʌ",
    "ɜ",
    "ə",
    # newer additions
    "a",
    "ɐ",
    "ɓ",
    "ɕ",
    "ɘ",
    "ɚ",
    "ɝ",
    "ɡ",
    "ɣ",
    "ɤ",
    "ɥ",
    "ɦ",
    "ɨ",
    "ɫ",
    "ɬ",
    "ɯ",
    "ɱ",
    "ɲ",
    "ɸ",
    "ɺ",
    "ʀ",
    "ʁ",
    "ʂ",
    "ʈ",
    "ʉ",
    "ʋ",
    "ʎ",
    "ʏ",
    "ʔ",
    "ʕ",
    "ʙ",
    "r",
    "x",
    "y",
    "ã",
    "ç",
    "õ",
    "ø",
    "ħ",
    "ĭ",
    "œ",
]

VALID_IPA_SET = set(VALID_IPA)

# regex to remove stress markers and slashes
clean_re = re.compile(r"[ˈˌ/]")

ipa_symbols = []
unknown_symbols = set()

# use a set to check duplicates but preserve insertion order
seen = set()


def load_mapping(lang):
    mapping_file = f"tools/ipa_to_{lang}.json"
    with open(mapping_file, "r", encoding="utf-8") as f:
        return json.load(f)


for filename in sorted(os.listdir(INPUT_FOLDER)):
    input_path = os.path.join(INPUT_FOLDER, filename)
    if not os.path.isfile(input_path):
        continue

    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) != 2:
                continue
            ipa_field = clean_re.sub("", parts[1])

            for ipa in ipa_field.split(","):
                ipa = ipa.strip()
                # extract multi-character sequences first
                for group in VALID_IPA:
                    if len(group) > 1 and group in ipa:
                        if group not in seen:
                            ipa_symbols.append(group)
                            seen.add(group)
                        ipa = ipa.replace(group, "")
                # add remaining single-character symbols if valid
                for char in ipa:
                    if char in VALID_IPA_SET and char not in seen:
                        ipa_symbols.append(char)
                        seen.add(char)
                    elif char not in VALID_IPA_SET and char.strip():
                        unknown_symbols.add(char)

for conv_dict in CONVERSION_DICTS:
    mapping = load_mapping(conv_dict)
    for sym in ipa_symbols:
        if not sym in mapping:
            mapping[sym] = "?"

    sorted_mapping = {
        sym: mapping[sym] for sym in sorted(mapping, key=lambda x: (-len(x), x))
    }

    with open(f"tools/ipa_to_{conv_dict}.json", "w", encoding="utf-8") as out_f:
        json.dump(sorted_mapping, out_f, ensure_ascii=False, indent=2)

print(f"Collected {len(ipa_symbols)} IPA symbols/groups.")

if unknown_symbols:
    print("Unknown symbols detected:", sorted(unknown_symbols))
else:
    print("No unknown symbols found.")
