# Cosmere Level Wizard
Cosmere Level Wizard is a module that adds a simple leveling tool, to help make it easier for players to see and remember all the options available to them.

Here's an example, using "Test Character", a Nimbleform Singer Scholar/Willshaper:

## Test Character in edit mode
The level up button only appears when you enable edit mode on a character, to not clutter the menu and keep things nice and pretty:

<img width="799" height="890" alt="image" src="https://github.com/user-attachments/assets/5f89dedf-6337-4235-8dbd-afae64933496" /> 

## Level wizard with no changes made
The level wizard correctly displays all skills that Test Character has available, including Cohesion and Transportation. 
It also ignores all active effects on character attributes, showing only the base values.

<img width="597" height="1201" alt="image" src="https://github.com/user-attachments/assets/7fb4a622-a9b5-4bd9-9455-c87cbe763253" />

## Level wizard with changes selected
The level wizard highlights all fields that have been changed as a result of decisions made during level up.

<img width="601" height="1202" alt="image" src="https://github.com/user-attachments/assets/19f4ed6f-b175-4f83-91d0-39d80907c672" />

## Future work priorities
1. Display secondary attribute-related changes when gaining an attribute, with an integrated panel to select another expertise when increasing Intellect
2. Add an integrated Talent selection section, to remove any last trace of things that need doing outside of the level up manager
3. Pretty-up the sheet, with a nicer-looking interface for displaying level and tier change in particular, and adding more of the styling from the core Cosmere system. (Maybe make the "level" input section on the character sheet into a big level-up button instead of adding a separate one? TBD.)
5. Make the level-up wizard able to handle the very first level, effectively turning it into a character creator wizard as well
6. Make some behaviors (e.g. ignoring active effects) toggleable in settings

Shout-out to the folks in the [Metalworks discord Character Creator module channel](https://discord.com/channels/1299110557689053264/1418609376498941992)! This is all new code, but analyzing theirs was very helpful for several steps of this project.
